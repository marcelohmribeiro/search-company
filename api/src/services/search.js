import { prisma } from "./prisma.js";
import { searchText } from "./places.js";
import { assertQuota, finishRequest, getUsage, reserveRequest } from "./usage.js";
import { saveSearchLeads } from "./leads.js";
import { settings } from "#src/config";
import { httpError } from "#src/utils";

const runningSearches = new Set();
const lastRequestAt = new Map();

/** Texto enviado à Text Search: "<categoria> em <bairro>, <cidade>" ou "<categoria> em <cidade>". */
function buildTextQuery({ category, neighborhood, city }) {
	return neighborhood ? `${category} em ${neighborhood}, ${city}` : `${category} em ${city}`;
}

/** Espera o intervalo mínimo entre chamadas do usuário, conforme `REQUESTS_PER_MINUTE`. */
async function waitForRateLimit(userId) {
	const interval = Math.ceil(60_000 / settings.REQUESTS_PER_MINUTE) + 200;
	const wait = (lastRequestAt.get(userId) ?? 0) + interval - Date.now();
	if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
	lastRequestAt.set(userId, Date.now());
}

function describeGoogleError(result) {
	const { status, message } = result.body?.error ?? {};
	return [result.status, status, message].filter(Boolean).join(" ");
}

/** Busca concluída do usuário com o mesmo texto que cobre ao menos `maxPages` páginas. */
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

/** Pede uma página à Text Search e registra a requisição no mês. Lança 429 no limite e 502 em falha do Google. */
async function fetchPage({ search, page, pageToken, apiKey }) {
	await waitForRateLimit(search.userId);
	const request = await reserveRequest({ searchId: search.id, page, userId: search.userId, apiKey });

	const result = await searchText({ textQuery: search.textQuery, pageToken, apiKey }).catch(async (error) => {
		await finishRequest(request.id, { status: "ERROR", error: error.message });
		throw httpError(502, `Falha ao chamar a Places API: ${error.message}`);
	});

	if (!result.ok) {
		const error = describeGoogleError(result);
		await finishRequest(request.id, { status: "ERROR", httpStatus: result.status, error, response: result.body });
		throw httpError(502, error);
	}

	const places = result.body?.places ?? [];
	await finishRequest(request.id, { status: "SUCCESS", httpStatus: result.status, resultsCount: places.length, response: result.body });
	return { places, nextPageToken: result.body?.nextPageToken };
}

/** Busca as páginas em sequência e grava os leads de cada uma. Para no fim das páginas, no limite ou no primeiro erro. */
async function fetchPages(search, apiKey) {
	const totals = { pagesFetched: 0, resultsCount: 0, newLeadsCount: 0 };
	let pageToken;
	try {
		for (let page = 1; page <= search.maxPages; page++) {
			const { places, nextPageToken } = await fetchPage({ search, page, pageToken, apiKey });
			totals.pagesFetched++;
			totals.resultsCount += places.length;
			totals.newLeadsCount += await saveSearchLeads(places, search, page);
			pageToken = nextPageToken;
			if (!pageToken) break;
		}
		return { ...totals, status: "DONE", error: null, exhausted: !pageToken };
	} catch (error) {
		if (!error.status) console.error(error);
		return { ...totals, status: error.status === 429 ? "LIMIT_REACHED" : "FAILED", error: error.message, exhausted: false };
	}
}

/** Roda uma combinação de categoria, bairro e cidade. Lança 409 com outra busca em andamento e 429 sem cota. */
async function runSearch(userId, { city, category, neighborhood, maxPages, skipIfDone }, apiKey) {
	if (runningSearches.has(userId)) throw httpError(409, "Você já tem uma busca em andamento.");
	runningSearches.add(userId);

	try {
		const textQuery = buildTextQuery({ category, neighborhood, city });
		const previous = skipIfDone ? await findCompletedSearch(userId, textQuery, maxPages) : null;
		if (previous) return { skipped: true, search: previous, usage: await getUsage(userId, apiKey) };

		await assertQuota(userId, apiKey);
		const search = await prisma.search.create({ data: { city, category, neighborhood, textQuery, maxPages, userId } });
		const result = await fetchPages(search, apiKey);
		const finished = await prisma.search.update({ where: { id: search.id }, data: { ...result, finishedAt: new Date() } });
		return { skipped: false, search: finished, usage: await getUsage(userId, apiKey) };
	} finally {
		runningSearches.delete(userId);
	}
}

const touchedLead = { OR: [{ status: { not: "NEW" } }, { notes: { not: null } }, { pitch: { isNot: null } }] };

/** Buscas do usuário, as mais recentes primeiro, com `deletable` quando nenhuma empresa que ela trouxe foi mexida. */
async function listSearches(userId, take = 100) {
	const searches = await prisma.search.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		take,
		include: { _count: { select: { userLeads: { where: touchedLead } } } },
	});
	return searches.map(({ _count, ...search }) => ({ ...search, deletable: search.status !== "RUNNING" && _count.userLeads === 0 }));
}

/**
 * Apaga uma busca do usuário. As empresas que ela trouxe primeiro passam para a próxima busca dele que as trouxe,
 * ou saem da lista. As requisições continuam no banco, sem a busca. Lança 409 se alguma empresa já foi mexida.
 */
async function deleteSearch(userId, id) {
	return prisma.$transaction(async (tx) => {
		const search = await tx.search.findFirst({ where: { id, userId } });
		if (!search) throw httpError(404, "Busca não encontrada.");
		if (search.status === "RUNNING") throw httpError(409, "A busca ainda está em andamento.");
		if (await tx.userLead.count({ where: { firstSearchId: id, ...touchedLead } }))
			throw httpError(409, "Essa busca trouxe empresas que já tiveram o status, anotações ou plano de venda alterados.");

		await tx.apiRequest.updateMany({ where: { searchId: id }, data: { searchId: null } });
		await tx.searchLead.deleteMany({ where: { searchId: id } });

		const userLeads = await tx.userLead.findMany({ where: { userId, firstSearchId: id }, select: { leadId: true } });
		const others = await tx.searchLead.findMany({
			where: { leadId: { in: userLeads.map((userLead) => userLead.leadId) }, search: { userId } },
			orderBy: { createdAt: "asc" },
			include: { search: true },
		});
		const nextSearch = new Map();
		for (const { leadId, createdAt, search: other } of others) if (!nextSearch.has(leadId)) nextSearch.set(leadId, { createdAt, other });

		for (const { leadId } of userLeads) {
			const next = nextSearch.get(leadId);
			if (!next) continue;
			await tx.userLead.update({
				where: { userId_leadId: { userId, leadId } },
				data: {
					firstSearchId: next.other.id,
					city: next.other.city,
					category: next.other.category,
					searchNeighborhood: next.other.neighborhood,
					firstSeenAt: next.createdAt,
				},
			});
		}
		await tx.userLead.deleteMany({ where: { userId, firstSearchId: id } });
		await tx.search.delete({ where: { id } });
	});
}

export { runSearch, listSearches, deleteSearch };
