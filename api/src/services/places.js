import { settings } from "#src/config";

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

/** Campos Essentials, Pro e Enterprise. Nunca use `*` nem campos Atmosphere: eles mudam o preço da requisição. */
const FIELD_MASK = [...ESSENTIALS_FIELDS, ...PRO_FIELDS, ...ENTERPRISE_FIELDS].join(",");

const REQUEST_TIMEOUT_MS = 30_000;

/** Envia uma requisição à Text Search. Devolve `{ ok, status, body }`; lança erro só sem resposta do Google. */
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
