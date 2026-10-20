import { classifySite } from "./_classifySite.js";

const NEIGHBORHOOD_TYPES = ["sublocality_level_1", "sublocality", "neighborhood"];

function findComponent(addressComponents = [], type) {
	return addressComponents.find((component) => component.types?.includes(type));
}

function findNeighborhood(addressComponents) {
	for (const type of NEIGHBORHOOD_TYPES) {
		const component = findComponent(addressComponents, type);
		if (component) return component.longText;
	}
	return null;
}

/** Converte um `Place` da Text Search nas colunas do `Lead`. */
function placeToLead(place) {
	return {
		name: place.displayName?.text ?? "(sem nome)",
		address: place.formattedAddress ?? null,
		neighborhood: findNeighborhood(place.addressComponents),
		state: findComponent(place.addressComponents, "administrative_area_level_1")?.shortText ?? null,
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

export { placeToLead };
