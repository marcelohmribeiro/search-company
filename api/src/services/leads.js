import { prisma } from "./prisma.js";

// O objeto completo do Google pesa alguns KB por lead e não é usado na listagem.
const OMIT_GOOGLE_DATA = { googleData: true };
const WITH_LEAD = { lead: { omit: OMIT_GOOGLE_DATA } };

// O `leadId` no fim desempata: sem ele, empresas com a mesma nota ou a mesma data podem trocar de lugar
// entre uma consulta e outra e aparecer em duas páginas, ou em nenhuma.
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

/**
 * Lead como o front recebe: os dados do Google com o acompanhamento e a busca de origem do usuário.
 * `firstSeenAt` é quando a empresa entrou na lista dele.
 */
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

/**
 * Página de leads do usuário que atendem aos filtros.
 * @returns {Promise<{ items: object[], total: number, page: number, pageSize: number }>}
 */
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

/**
 * Valores distintos de cidade, categoria e bairro nos leads do usuário, em ordem alfabética.
 * O bairro junta o bairro do Google e o bairro das buscas.
 */
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

/**
 * Atualiza só os campos de acompanhamento do lead na lista do usuário.
 * @param {number} userId
 * @param {string} id `places.id`.
 * @param {{ status?: string, notes?: string | null }} data
 * @throws 404 (P2025) se a empresa não está na lista do usuário.
 */
async function updateLead(userId, id, data) {
	const row = await prisma.userLead.update({
		where: { userId_leadId: { userId, leadId: id } },
		data,
		include: WITH_LEAD,
	});
	return toUserLead(row);
}

export { listLeads, getLeadFilterOptions, updateLead };
