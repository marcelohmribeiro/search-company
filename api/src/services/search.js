import { prisma } from "./prisma.js";
import { searchText } from "./places.js";
import { getUsage, reserveRequest, finishRequest } from "./usage.js";
import { getGoogleApiKey } from "./users.js";
import { settings } from "#src/config";
import { classifySite, httpError } from "#src/utils";

const NEIGHBORHOOD_TYPES = ["sublocality_level_1", "sublocality", "neighborhood"];

// Por usuário: cada um busca com a própria chave, que tem a própria cota por minuto no console do Google.
const runningSearches = new Set();
const lastRequestAt = new Map();

/**
 * Texto enviado à Text Search: "<categoria> em <bairro>, <cidade>", ou "<categoria> em <cidade>" sem bairro.
 */
function buildTextQuery({ category, neighborhood, city }) {
	return neighborhood ? `${category} em ${neighborhood}, ${city}` : `${category} em ${city}`;
}

// Espaça as chamadas para não estourar a cota por minuto do console. Um 429 do Google
// também conta no limite mensal, já que a requisição foi reservada.
async function waitForRateLimit(userId) {
	const interval = Math.ceil(60_000 / settings.REQUESTS_PER_MINUTE) + 200;
	const wait = (lastRequestAt.get(userId) ?? 0) + interval - Date.now();
	if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
	lastRequestAt.set(userId, Date.now());
}

function findNeighborhood(addressComponents = []) {
	for (const type of NEIGHBORHOOD_TYPES) {
		const component = addressComponents.find((item) => item.types?.includes(type));
		if (component) return component.longText;
	}
	return null;
}

function findState(addressComponents = []) {
	const component = addressComponents.find((item) => item.types?.includes("administrative_area_level_1"));
	return component?.shortText ?? null;
}

function toLeadData(place) {
	return {
		name: place.displayName?.text ?? "(sem nome)",
		address: place.formattedAddress ?? null,
		neighborhood: findNeighborhood(place.addressComponents),
		state: findState(place.addressComponents),
		primaryType: place.primaryType ?? null,
		primaryTypeName: place.primaryTypeDisplayName?.text ?? null,
		nationalPhone: place.nationalPhoneNumber ?? null,
		internationalPhone: place.internationalPhoneNumber ?? null,
		websiteUri: place.websiteUri ?? null,
		siteStatus: classifySite(place.websiteUri),
		rating: place.rating ?? null,
		userRatingCount: place.userRatingCount ?? null,
		googleMapsUri: place.googleMapsUri ?? null,
		businessStatus: place.businessStatus ?? null,
		types: place.types ?? [],
		pureServiceArea: place.pureServiceAreaBusiness ?? null,
		openingHours: place.regularOpeningHours?.weekdayDescriptions ?? [],
		priceLevel: place.priceLevel ?? null,
		reviewsUri: place.googleMapsLinks?.reviewsUri ?? null,
		photosUri: place.googleMapsLinks?.photosUri ?? null,
		googleData: place,
	};
}

/**
 * Grava os lugares como leads, deduplicando pelo `places.id`, coloca-os na lista do dono da busca e registra
 * em `SearchLead` que a busca os trouxe. Um lugar que já existe, trazido por qualquer usuário, tem os dados do
 * Google atualizados; na lista de quem já o tinha, mantém status, anotações e a busca de origem.
 * Todos os lugares com `id` são gravados, inclusive os fechados.
 * @param {object[]} places `places` da resposta da Text Search.
 * @param {object} search Busca que trouxe os lugares.
 * @param {number} page Página da busca em que os lugares vieram.
 * @returns {Promise<number>} Quantidade de leads novos na lista do usuário.
 */
async function saveLeads(places, search, page) {
	// Um lugar sem `id` não vira lead, mas continua na resposta guardada em `ApiRequest.response`.
	const withId = places.filter((place) => place.id);
	const ids = [...new Set(withId.map((place) => place.id))];
	if (!ids.length) return 0;

	const now = new Date();
	const results = await prisma.$transaction([
		...withId.map((place) => {
			const data = toLeadData(place);
			return prisma.lead.upsert({
				where: { id: place.id },
				create: { id: place.id, ...data, firstSeenAt: now, lastSeenAt: now },
				update: { ...data, lastSeenAt: now },
			});
		}),
		prisma.searchLead.createMany({
			data: ids.map((leadId) => ({ searchId: search.id, leadId, page, createdAt: now })),
			skipDuplicates: true,
		}),
		prisma.userLead.createMany({
			data: ids.map((leadId) => ({
				userId: search.userId,
				leadId,
				city: search.city,
				category: search.category,
				searchNeighborhood: search.neighborhood,
				firstSearchId: search.id,
				firstSeenAt: now,
			})),
			skipDuplicates: true,
		}),
	]);

	return results.at(-1).count;
}

function describeGoogleError(result) {
	const { status, message } = result.body?.error ?? {};
	return [result.status, status, message].filter(Boolean).join(" ");
}

/**
 * Busca mais recente do usuário com o mesmo texto que terminou e cobre ao menos `maxPages` páginas
 * (ou todas as que existiam).
 */
async function findCompletedSearch(userId, textQuery, maxPages) {
	return prisma.search.findFirst({
		where: {
			userId,
			textQuery: { equals: textQuery, mode: "insensitive" },
			status: "DONE",
			OR: [{ exhausted: true }, { pagesFetched: { gte: maxPages } }],
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Pede uma página à Text Search e registra a requisição no contador do mês: a linha é criada antes da
 * chamada e recebe o resultado depois, inclusive quando a chamada falha.
 * @returns {Promise<{ places: object[], nextPageToken?: string }>}
 * @throws Erro 429 com o limite do mês atingido, sem chamar o Google. Erro 502 com a mensagem do Google ou
 * da rede quando a chamada falha; nesse caso, a requisição já conta no mês.
 */
async function fetchPage({ searchId, page, textQuery, pageToken, userId, apiKey, keyHash }) {
	await waitForRateLimit(userId);
	const request = await reserveRequest({ searchId, page, userId, keyHash });

	let result;
	try {
		result = await searchText({ textQuery, pageToken, apiKey });
	} catch (fetchError) {
		await finishRequest(request.id, { status: "ERROR", error: fetchError.message });
		throw httpError(502, `Falha ao chamar a Places API: ${fetchError.message}`);
	}

	if (!result.ok) {
		const error = describeGoogleError(result);
		await finishRequest(request.id, { status: "ERROR", httpStatus: result.status, error, response: result.body });
		throw httpError(502, error);
	}

	const places = result.body?.places ?? [];
	await finishRequest(request.id, {
		status: "SUCCESS",
		httpStatus: result.status,
		resultsCount: places.length,
		response: result.body,
	});
	return { places, nextPageToken: result.body?.nextPageToken };
}

/**
 * Roda uma busca do usuário (uma combinação categoria × bairro × cidade) na Places API, com a chave do Google
 * salva por ele, página por página, e grava os leads de cada página no banco. A busca para no limite do mês,
 * no primeiro erro ou quando não há próxima página. Não há nova tentativa.
 * @param {number} userId
 * @param {{ city: string, category: string, neighborhood?: string, maxPages: number, skipIfDone: boolean }} input
 * @returns {Promise<{ skipped: boolean, search: object, usage: object }>} Com `skipped`, `search` é a
 * busca anterior do usuário e nenhuma requisição é feita.
 * @throws 400 sem chave do Google salva, 409 com outra busca do usuário em andamento, 429 com o limite do mês
 * atingido.
 */
async function runSearch(userId, { city, category, neighborhood, maxPages, skipIfDone }) {
	const { apiKey, keyHash } = await getGoogleApiKey(userId);

	if (runningSearches.has(userId)) {
		throw httpError(409, "Você já tem uma busca em andamento.");
	}

	runningSearches.add(userId);
	try {
		const textQuery = buildTextQuery({ category, neighborhood, city });

		if (skipIfDone) {
			const previous = await findCompletedSearch(userId, textQuery, maxPages);
			if (previous) return { skipped: true, search: previous, usage: await getUsage(userId) };
		}

		const usage = await getUsage(userId);
		if (usage.remaining <= 0) {
			throw httpError(429, `Limite de ${usage.limit} requisições do mês ${usage.period} atingido.`);
		}

		const search = await prisma.search.create({
			data: { city, category, neighborhood, textQuery, maxPages, userId },
		});

		const totals = { pagesFetched: 0, resultsCount: 0, newLeadsCount: 0 };
		let status = "DONE";
		let error = null;
		let pageToken;

		try {
			for (let page = 1; page <= maxPages; page++) {
				const { places, nextPageToken } = await fetchPage({
					searchId: search.id,
					page,
					textQuery,
					pageToken,
					userId,
					apiKey,
					keyHash,
				});
				totals.pagesFetched++;
				totals.resultsCount += places.length;
				totals.newLeadsCount += await saveLeads(places, search, page);

				pageToken = nextPageToken;
				if (!pageToken) break;
			}
		} catch (stop) {
			// Limite (429) e falha do Google (502) ficam registrados na busca; o resto é inesperado.
			if (!stop.status) console.error(stop);
			status = stop.status === 429 ? "LIMIT_REACHED" : "FAILED";
			error = stop.message;
		}

		const finished = await prisma.search.update({
			where: { id: search.id },
			data: {
				...totals,
				status,
				error,
				exhausted: status === "DONE" && !pageToken,
				finishedAt: new Date(),
			},
		});

		return { skipped: false, search: finished, usage: await getUsage(userId) };
	} finally {
		runningSearches.delete(userId);
	}
}

/**
 * Buscas do usuário, as mais recentes primeiro.
 * @param {number} userId
 * @param {number} [take]
 */
async function listSearches(userId, take = 100) {
	return prisma.search.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
}

export { runSearch, listSearches };
