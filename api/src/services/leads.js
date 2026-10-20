import { prisma } from "./prisma.js";
import { httpError, placeToLead } from "#src/utils";

const WITH_LEAD = { lead: { omit: { googleData: true } } };

const ORDER_BY = {
	reviews: [
		{ lead: { userRatingCount: { sort: "desc", nulls: "last" } } },
		{ lead: { rating: { sort: "desc", nulls: "last" } } },
		{ leadId: "asc" },
	],
	rating: [
		{ lead: { rating: { sort: "desc", nulls: "last" } } },
		{ lead: { userRatingCount: { sort: "desc", nulls: "last" } } },
		{ leadId: "asc" },
	],
	name: [{ lead: { name: "asc" } }, { leadId: "asc" }],
	recent: [{ firstSeenAt: "desc" }, { leadId: "asc" }],
};

/** Junta os dados do `Lead` com o acompanhamento do usuário (`UserLead`). */
function toUserLead({ lead, userId, leadId, firstSearchId, ...tracking }) {
	return { ...lead, ...tracking };
}

function buildWhere(userId, filters) {
	const lead = {};
	if (filters.siteStatus?.length) lead.siteStatus = { in: filters.siteStatus };
	if (filters.businessStatus?.length) lead.businessStatus = { in: filters.businessStatus };
	if (filters.minRating != null) lead.rating = { gte: filters.minRating };
	if (filters.minReviews != null) lead.userRatingCount = { gte: filters.minReviews };
	if (filters.q) lead.name = { contains: filters.q, mode: "insensitive" };

	const where = { userId, lead };
	if (filters.status?.length) where.status = { in: filters.status };
	if (filters.city) where.city = { equals: filters.city, mode: "insensitive" };
	if (filters.category) where.category = { equals: filters.category, mode: "insensitive" };
	if (filters.neighborhood) {
		where.OR = [
			{ lead: { neighborhood: { equals: filters.neighborhood, mode: "insensitive" } } },
			{ searchNeighborhood: { equals: filters.neighborhood, mode: "insensitive" } },
		];
	}
	return where;
}

/** Página de leads do usuário com filtros: `{ items, total, page, pageSize }`. */
async function listLeads(userId, filters, { page, pageSize, orderBy }) {
	const where = buildWhere(userId, filters);
	const [rows, total] = await prisma.$transaction([
		prisma.userLead.findMany({
			where,
			include: WITH_LEAD,
			orderBy: ORDER_BY[orderBy] ?? ORDER_BY.reviews,
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.userLead.count({ where }),
	]);
	return { items: rows.map(toUserLead), total, page, pageSize };
}

/** Cidades, categorias e bairros distintos nos leads do usuário, em ordem alfabética. */
async function getLeadFilterOptions(userId) {
	const rows = await prisma.userLead.findMany({
		where: { userId },
		select: { city: true, category: true, searchNeighborhood: true, lead: { select: { neighborhood: true } } },
	});
	const sorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
	return {
		cities: sorted(rows.map((row) => row.city)),
		categories: sorted(rows.map((row) => row.category)),
		neighborhoods: sorted(rows.flatMap((row) => [row.lead.neighborhood, row.searchNeighborhood])),
	};
}

/** Atualiza status e anotações do lead na lista do usuário. Lança 404 se ele não está na lista. */
async function updateLead(userId, id, data) {
	const row = await prisma.userLead.update({
		where: { userId_leadId: { userId, leadId: id } },
		data,
		include: WITH_LEAD,
	});
	return toUserLead(row);
}

/** Empresas que uma busca do usuário trouxe, com `page` e `isNew`. Lança 404 se a busca não é dele. */
async function listSearchLeads(userId, searchId) {
	const search = await prisma.search.findFirst({ where: { id: searchId, userId } });
	if (!search) throw httpError(404, "Busca não encontrada.");

	const found = await prisma.searchLead.findMany({ where: { searchId }, select: { leadId: true, page: true } });
	const pageOf = new Map(found.map((row) => [row.leadId, row.page]));
	const rows = await prisma.userLead.findMany({
		where: { userId, leadId: { in: [...pageOf.keys()] } },
		include: WITH_LEAD,
		orderBy: ORDER_BY.reviews,
	});

	const items = rows
		.map((row) => ({ ...toUserLead(row), page: pageOf.get(row.leadId), isNew: row.firstSearchId === searchId }))
		.sort((a, b) => a.page - b.page);
	return { search, items };
}

/** Grava os lugares de uma página da busca e devolve quantos entraram na lista do usuário. */
async function saveSearchLeads(places, search, page) {
	const withId = places.filter((place) => place.id);
	const ids = [...new Set(withId.map((place) => place.id))];
	if (!ids.length) return 0;

	const now = new Date();
	const results = await prisma.$transaction([
		...withId.map((place) => {
			const data = placeToLead(place);
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

export { listLeads, getLeadFilterOptions, updateLead, listSearchLeads, saveSearchLeads };
