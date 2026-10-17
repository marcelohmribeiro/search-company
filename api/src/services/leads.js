import { prisma } from "./prisma.js";

// O objeto completo do Google pesa alguns KB por lead e não é usado na listagem.
const OMIT_GOOGLE_DATA = { googleData: true };

const ORDER_BY = {
	reviews: [{ userRatingCount: { sort: "desc", nulls: "last" } }, { rating: { sort: "desc", nulls: "last" } }],
	rating: [{ rating: { sort: "desc", nulls: "last" } }, { userRatingCount: { sort: "desc", nulls: "last" } }],
	name: [{ name: "asc" }],
	recent: [{ firstSeenAt: "desc" }],
};

function buildWhere(filters) {
	const where = {};
	if (filters.siteStatus?.length) where.siteStatus = { in: filters.siteStatus };
	if (filters.status?.length) where.status = { in: filters.status };
	if (filters.businessStatus?.length) where.businessStatus = { in: filters.businessStatus };
	if (filters.minRating != null) where.rating = { gte: filters.minRating };
	if (filters.minReviews != null) where.userRatingCount = { gte: filters.minReviews };
	if (filters.city) where.city = { equals: filters.city, mode: "insensitive" };
	if (filters.category) where.category = { equals: filters.category, mode: "insensitive" };
	if (filters.q) where.name = { contains: filters.q, mode: "insensitive" };
	if (filters.neighborhood) {
		where.OR = [
			{ neighborhood: { equals: filters.neighborhood, mode: "insensitive" } },
			{ searchNeighborhood: { equals: filters.neighborhood, mode: "insensitive" } },
		];
	}
	return where;
}

/**
 * Página de leads que atendem aos filtros.
 * @returns {Promise<{ items: object[], total: number, page: number, pageSize: number }>}
 */
async function listLeads(filters, { page, pageSize, orderBy }) {
	const where = buildWhere(filters);
	const [items, total] = await prisma.$transaction([
		prisma.lead.findMany({
			where,
			omit: OMIT_GOOGLE_DATA,
			orderBy: ORDER_BY[orderBy] ?? ORDER_BY.reviews,
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.lead.count({ where }),
	]);
	return { items, total, page, pageSize };
}

/**
 * Valores distintos de cidade, categoria e bairro já gravados, em ordem alfabética.
 * O bairro junta o bairro do Google e o bairro das buscas.
 */
async function getLeadFilterOptions() {
	const rows = await prisma.lead.findMany({
		select: { city: true, category: true, neighborhood: true, searchNeighborhood: true },
		distinct: ["city", "category", "neighborhood", "searchNeighborhood"],
	});
	const sorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
	return {
		cities: sorted(rows.map((row) => row.city)),
		categories: sorted(rows.map((row) => row.category)),
		neighborhoods: sorted(rows.flatMap((row) => [row.neighborhood, row.searchNeighborhood])),
	};
}

/**
 * Atualiza só os campos de acompanhamento do lead.
 * @param {string} id `places.id`.
 * @param {{ status?: string, notes?: string | null }} data
 */
async function updateLead(id, data) {
	return prisma.lead.update({ where: { id }, data, omit: OMIT_GOOGLE_DATA });
}

export { listLeads, getLeadFilterOptions, updateLead };
