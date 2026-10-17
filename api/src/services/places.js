import { settings } from "#src/config";

// A requisição é cobrada pelo SKU mais caro entre os campos. Como `websiteUri` e telefones já a colocam
// em Text Search Enterprise, todos os campos Essentials, Pro e Enterprise vêm sem custo extra.
// Campos Enterprise + Atmosphere (reviews, editorialSummary, paymentOptions, serves*, delivery etc.)
// ou `*` mudariam o SKU e não podem entrar.
// `entrances`, `navigationPoints` e `searchUri` ficam de fora porque a documentação não define o SKU deles
// de forma consistente.
// Listas por SKU: https://developers.google.com/maps/billing-and-pricing/sku-details
const ESSENTIALS_FIELDS = [
	"places.id",
	"places.name",
	"places.attributions",
	"places.consumerAlert",
	"places.movedPlace",
	"places.movedPlaceId",
	"nextPageToken",
];

const PRO_FIELDS = [
	"places.accessibilityOptions",
	"places.addressComponents",
	"places.addressDescriptor",
	"places.adrFormatAddress",
	"places.businessStatus",
	"places.containingPlaces",
	"places.displayName",
	"places.formattedAddress",
	"places.googleMapsLinks",
	"places.googleMapsTypeLabel",
	"places.googleMapsUri",
	"places.iconBackgroundColor",
	"places.iconMaskBaseUri",
	"places.location",
	"places.openingDate",
	"places.photos",
	"places.plusCode",
	"places.postalAddress",
	"places.primaryType",
	"places.primaryTypeDisplayName",
	"places.pureServiceAreaBusiness",
	"places.shortFormattedAddress",
	"places.subDestinations",
	"places.timeZone",
	"places.types",
	"places.utcOffsetMinutes",
	"places.viewport",
];

const ENTERPRISE_FIELDS = [
	"places.currentOpeningHours",
	"places.currentSecondaryOpeningHours",
	"places.internationalPhoneNumber",
	"places.nationalPhoneNumber",
	"places.priceLevel",
	"places.priceRange",
	"places.rating",
	"places.regularOpeningHours",
	"places.regularSecondaryOpeningHours",
	"places.transitStation",
	"places.userRatingCount",
	"places.websiteUri",
];

const FIELD_MASK = [...ESSENTIALS_FIELDS, ...PRO_FIELDS, ...ENTERPRISE_FIELDS].join(",");

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Envia uma única requisição à Text Search (New). Cada chamada é uma requisição cobrada pelo Google,
 * então ela só deve ser feita depois de `reserveRequest`.
 * @param {{ textQuery: string, pageToken?: string, apiKey: string }} params Na paginação, `textQuery` precisa
 * ser igual ao da primeira página. `apiKey` é a chave informada na busca; ela só é repassada ao Google.
 * @returns {Promise<{ ok: boolean, status: number, body: any }>} `body` é `null` quando a resposta não é JSON.
 * @throws Erro de rede ou de timeout, sem resposta do Google.
 */
async function searchText({ textQuery, pageToken, apiKey }) {
	const response = await fetch(settings.PLACES_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Goog-Api-Key": apiKey,
			"X-Goog-FieldMask": FIELD_MASK,
		},
		body: JSON.stringify({
			textQuery,
			languageCode: "pt-BR",
			regionCode: "BR",
			pageSize: 20,
			includePureServiceAreaBusinesses: true,
			...(pageToken && { pageToken }),
		}),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});

	const body = await response.json().catch(() => null);
	return { ok: response.ok, status: response.status, body };
}

export { searchText };
