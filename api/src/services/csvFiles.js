import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma.js";
import { settings } from "#src/config";
import { buildCsv } from "#src/utils";

const UNKNOWN_STATE = "XX";

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

/**
 * Link de conversa individual no WhatsApp a partir do telefone internacional ("+55 85 99999-9999").
 * @returns {string | null} `null` quando não há telefone.
 */
function whatsappLink(internationalPhone) {
	const digits = internationalPhone?.replace(/\D/g, "");
	return digits ? `https://wa.me/${digits}` : null;
}

const CITY_CSV_COLUMNS = [
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
	["ID do Google", (lead) => lead.id],
];

const localDateFormatter = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });

/** "São Gonçalo do Amarante" vira "sao-goncalo-do-amarante". */
function slugify(text) {
	return text
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function mostCommonState(leads) {
	const counts = new Map();
	for (const { state } of leads) {
		if (state) counts.set(state, (counts.get(state) ?? 0) + 1);
	}
	return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/**
 * Regrava o CSV de `city` no dia de hoje (fuso do sistema) com todas as empresas que as buscas dessa
 * cidade trouxeram hoje, sem repetição. O arquivo fica em `CSV_DIR`, com o nome
 * "<estado>-<cidade>-<qtde>-<aaaa-mm-dd>.csv", e substitui a versão anterior do mesmo dia.
 * O estado do nome é o mais frequente entre as empresas ("XX" se nenhuma tiver) e preenche a coluna
 * "Estado" de quem não tem estado no endereço. A coluna "Cidade" mostra `city`, mesmo para leads
 * encontrados antes em buscas de outra cidade.
 * @param {string} city Cidade como foi informada na busca.
 * @returns {Promise<string | null>} Nome do arquivo gravado. `null` quando nenhuma busca da cidade trouxe empresas hoje.
 */
async function writeCityCsv(city) {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(end.getDate() + 1);
	const date = localDateFormatter.format(start);

	const found = await prisma.lead.findMany({
		where: {
			searchResults: {
				some: {
					createdAt: { gte: start, lt: end },
					search: { city: { equals: city, mode: "insensitive" } },
				},
			},
		},
		omit: { googleData: true },
		orderBy: [{ userRatingCount: { sort: "desc", nulls: "last" } }, { name: "asc" }],
	});
	if (!found.length) return null;

	const state = mostCommonState(found);
	const rows = found.map((lead) => ({ ...lead, city, state: lead.state ?? state }));
	const citySlug = slugify(city);
	const fileName = `${(state ?? UNKNOWN_STATE).toUpperCase()}-${citySlug}-${rows.length}-${date}.csv`;
	const filePath = path.join(settings.CSV_DIR, fileName);

	await fs.mkdir(settings.CSV_DIR, { recursive: true });
	await fs.writeFile(`${filePath}.tmp`, buildCsv(CITY_CSV_COLUMNS, rows), "utf8");
	await fs.rename(`${filePath}.tmp`, filePath);

	// A versão anterior do dia tem outra quantidade (ou outro estado) no nome e ficaria duplicada.
	const previousVersion = new RegExp(`^[A-Z]{2}-${citySlug}-\\d+-${date}\\.csv$`);
	const outdated = (await fs.readdir(settings.CSV_DIR)).filter((name) => previousVersion.test(name) && name !== fileName);
	await Promise.all(outdated.map((name) => fs.rm(path.join(settings.CSV_DIR, name), { force: true })));

	return fileName;
}

export { writeCityCsv };
