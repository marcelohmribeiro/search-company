import { prisma } from "./prisma.js";
import { buildCsv } from "#src/utils";

const SITE_STATUS_LABELS = {
	NO_WEBSITE: "Sem site",
	INSTAGRAM_ONLY: "Só Instagram",
	WHATSAPP_ONLY: "Só WhatsApp",
	FACEBOOK_ONLY: "Só Facebook",
	LINK_AGGREGATOR: "Agregador de links",
	HAS_WEBSITE: "Tem site",
};

const BUSINESS_STATUS_LABELS = {
	OPERATIONAL: "Funcionando",
	CLOSED_TEMPORARILY: "Fechada temporariamente",
	CLOSED_PERMANENTLY: "Fechada definitivamente",
	FUTURE_OPENING: "Abre em breve",
};

const LEAD_STATUS_LABELS = {
	NEW: "Novo",
	CONTACTED: "Contatado",
	REPLIED: "Respondeu",
	CLOSED: "Fechado",
	DISCARDED: "Descartado",
};

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

/**
 * Link de conversa individual no WhatsApp a partir do telefone internacional ("+55 85 99999-9999").
 * @returns {string | null} `null` quando não há telefone.
 */
function whatsappLink(internationalPhone) {
	const digits = internationalPhone?.replace(/\D/g, "");
	return digits ? `https://wa.me/${digits}` : null;
}

const LEAD_CSV_COLUMNS = [
	["Nome", (lead) => lead.name],
	["Categoria", (lead) => lead.category],
	["Bairro", (lead) => lead.neighborhood ?? lead.searchNeighborhood],
	["Cidade", (lead) => lead.city],
	["Estado", (lead) => lead.state],
	["Endereço", (lead) => lead.address],
	["Telefone", (lead) => lead.nationalPhone],
	["WhatsApp", (lead) => whatsappLink(lead.internationalPhone)],
	["Funcionamento", (lead) => BUSINESS_STATUS_LABELS[lead.businessStatus] ?? lead.businessStatus],
	["Situação do site", (lead) => SITE_STATUS_LABELS[lead.siteStatus]],
	["Site", (lead) => lead.websiteUri],
	["Nota", (lead) => lead.rating?.toString().replace(".", ",")],
	["Avaliações", (lead) => lead.userRatingCount],
	["Sem endereço físico", (lead) => (lead.pureServiceArea ? "Sim" : "")],
	["Horário", (lead) => lead.openingHours.join(" | ")],
	["Status", (lead) => LEAD_STATUS_LABELS[lead.status]],
	["Anotações", (lead) => lead.notes],
	["Google Maps", (lead) => lead.googleMapsUri],
	["Avaliações no Maps", (lead) => lead.reviewsUri],
	["Encontrado em", (lead) => lead.firstSeenAt.toISOString().slice(0, 10)],
];

/**
 * CSV de todos os leads que atendem aos filtros, no formato de `buildCsv`.
 * @returns {Promise<string>}
 */
async function exportLeadsCsv(filters, { orderBy }) {
	const leads = await prisma.lead.findMany({
		where: buildWhere(filters),
		omit: OMIT_GOOGLE_DATA,
		orderBy: ORDER_BY[orderBy] ?? ORDER_BY.reviews,
	});
	return buildCsv(LEAD_CSV_COLUMNS, leads);
}

export { LEAD_CSV_COLUMNS, listLeads, getLeadFilterOptions, updateLead, exportLeadsCsv };
