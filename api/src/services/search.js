import { prisma } from "./prisma.js";
import { searchText } from "./places.js";
import { getUsage, reserveRequest, finishRequest } from "./usage.js";
import { writeCityCsv } from "./csvFiles.js";
import { settings } from "#src/config";
import { classifySite, httpError } from "#src/utils";

const NEIGHBORHOOD_TYPES = ["sublocality_level_1", "sublocality", "neighborhood"];

let searchRunning = false;
let lastRequestAt = 0;

/**
 * Texto enviado à Text Search: "<categoria> em <bairro>, <cidade>", ou "<categoria> em <cidade>" sem bairro.
 */
function buildTextQuery({ category, neighborhood, city }) {
	return neighborhood ? `${category} em ${neighborhood}, ${city}` : `${category} em ${city}`;
}

// Espaça as chamadas para não estourar a cota por minuto do console. Um 429 do Google
// também conta no limite mensal, já que a requisição foi reservada.
async function waitForRateLimit() {
	const interval = Math.ceil(60_000 / settings.REQUESTS_PER_MINUTE) + 200;
	const wait = lastRequestAt + interval - Date.now();
	if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
	lastRequestAt = Date.now();
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
 * Grava os lugares como leads, deduplicando pelo `places.id`, e registra em `SearchLead` que a busca
 * os trouxe. Lugares já conhecidos têm os dados do Google atualizados, mas mantêm status, anotações e
 * a busca de origem. Todos os lugares com `id` são gravados, inclusive os fechados.
 * @param {object[]} places `places` da resposta da Text Search.
 * @param {object} search Busca que trouxe os lugares.
 * @param {number} page Página da busca em que os lugares vieram.
 * @returns {Promise<number>} Quantidade de leads novos.
 */
async function saveLeads(places, search, page) {
	// Um lugar sem `id` não vira lead, mas continua na resposta guardada em `ApiRequest.response`.
	const withId = places.filter((place) => place.id);
	const ids = [...new Set(withId.map((place) => place.id))];
	if (!ids.length) return 0;

	const existing = await prisma.lead.findMany({ where: { id: { in: ids } }, select: { id: true } });
	const known = new Set(existing.map((lead) => lead.id));
	const now = new Date();

	await prisma.$transaction([
		...withId.map((place) => {
			const data = toLeadData(place);
			return prisma.lead.upsert({
				where: { id: place.id },
				create: {
					id: place.id,
					...data,
					city: search.city,
					category: search.category,
					searchNeighborhood: search.neighborhood,
					firstSearchId: search.id,
					firstSeenAt: now,
					lastSeenAt: now,
				},
				update: { ...data, lastSeenAt: now },
			});
		}),
		prisma.searchLead.createMany({
			data: ids.map((leadId) => ({ searchId: search.id, leadId, page, createdAt: now })),
			skipDuplicates: true,
		}),
	]);

	return ids.filter((id) => !known.has(id)).length;
}

// Os leads já estão no banco quando o CSV é gravado: uma falha no arquivo não desfaz nem invalida a busca.
async function saveCityCsv(city) {
	try {
		return { file: await writeCityCsv(city) };
	} catch (csvError) {
		console.error(`[CSV] Falha ao gravar o CSV de ${city}:`, csvError);
		return { file: null, error: csvError.message };
	}
}

function describeGoogleError(result) {
	const { status, message } = result.body?.error ?? {};
	return [result.status, status, message].filter(Boolean).join(" ");
}

/**
 * Busca mais recente com o mesmo texto que terminou e cobre ao menos `maxPages` páginas
 * (ou todas as que existiam).
 */
async function findCompletedSearch(textQuery, maxPages) {
	return prisma.search.findFirst({
		where: {
			textQuery: { equals: textQuery, mode: "insensitive" },
			status: "DONE",
			OR: [{ exhausted: true }, { pagesFetched: { gte: maxPages } }],
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Roda uma busca (uma combinação categoria × bairro × cidade) na Places API, página por página,
 * e grava os leads de cada página no banco e no CSV da cidade. Cada página reserva uma requisição no limite
 * mensal antes de ser enviada, e a busca para no limite, no primeiro erro ou quando não há próxima página.
 * Não há nova tentativa.
 * @param {{ city: string, category: string, neighborhood?: string, maxPages: number, skipIfDone: boolean }} input
 * @returns {Promise<{ skipped: boolean, search: object, usage: object, csv?: { file: string | null, error?: string } }>}
 * `csv` traz o resultado da última gravação do CSV. Com `skipped`, `search` é a busca anterior,
 * nenhuma requisição é feita e não há `csv`.
 * @throws 503 sem `GOOGLE_API_KEY`, 409 com outra busca em andamento, 429 com o limite do mês atingido.
 */
async function runSearch({ city, category, neighborhood, maxPages, skipIfDone }) {
	if (!settings.GOOGLE_API_KEY) {
		throw httpError(503, "GOOGLE_API_KEY não está configurada no api/.env.");
	}
	if (searchRunning) {
		throw httpError(409, "Já existe uma busca em andamento.");
	}

	searchRunning = true;
	try {
		const textQuery = buildTextQuery({ category, neighborhood, city });

		if (skipIfDone) {
			const previous = await findCompletedSearch(textQuery, maxPages);
			if (previous) return { skipped: true, search: previous, usage: await getUsage() };
		}

		const usage = await getUsage();
		if (usage.remaining <= 0) {
			throw httpError(429, `Limite de ${usage.limit} requisições do mês ${usage.period} atingido.`);
		}

		let search = await prisma.search.create({
			data: { city, category, neighborhood, textQuery, maxPages },
		});

		let pageToken;
		let status = "DONE";
		let error = null;
		const totals = { pagesFetched: 0, resultsCount: 0, newLeadsCount: 0 };
		let csv = { file: null };

		try {
			for (let page = 1; page <= maxPages; page++) {
				await waitForRateLimit();

				let request;
				try {
					request = await reserveRequest({ searchId: search.id, page });
				} catch (reserveError) {
					if (reserveError.status !== 429) throw reserveError;
					status = "LIMIT_REACHED";
					error = reserveError.message;
					break;
				}

				let result;
				try {
					result = await searchText({ textQuery, pageToken });
				} catch (fetchError) {
					await finishRequest(request.id, { status: "ERROR", error: fetchError.message });
					status = "FAILED";
					error = `Falha ao chamar a Places API: ${fetchError.message}`;
					break;
				}

				if (!result.ok) {
					error = describeGoogleError(result);
					await finishRequest(request.id, { status: "ERROR", httpStatus: result.status, error, response: result.body });
					status = "FAILED";
					break;
				}

				const places = result.body?.places ?? [];
				await finishRequest(request.id, {
					status: "SUCCESS",
					httpStatus: result.status,
					resultsCount: places.length,
					response: result.body,
				});

				totals.pagesFetched++;
				totals.resultsCount += places.length;
				totals.newLeadsCount += await saveLeads(places, search, page);
				if (places.length) csv = await saveCityCsv(search.city);

				pageToken = result.body?.nextPageToken;
				if (!pageToken) break;
			}
		} catch (unexpectedError) {
			console.error(unexpectedError);
			status = "FAILED";
			error = unexpectedError.message;
		}

		search = await prisma.search.update({
			where: { id: search.id },
			data: {
				...totals,
				status,
				error,
				exhausted: status === "DONE" && !pageToken,
				finishedAt: new Date(),
			},
		});

		return { skipped: false, search, usage: await getUsage(), csv };
	} finally {
		searchRunning = false;
	}
}

/**
 * Buscas mais recentes primeiro.
 * @param {number} [take]
 */
async function listSearches(take = 100) {
	return prisma.search.findMany({ orderBy: { createdAt: "desc" }, take });
}

export { buildTextQuery, runSearch, listSearches };
