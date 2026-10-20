export type SiteStatus =
	| 'NO_WEBSITE'
	| 'INSTAGRAM_ONLY'
	| 'WHATSAPP_ONLY'
	| 'FACEBOOK_ONLY'
	| 'LINK_AGGREGATOR'
	| 'HAS_WEBSITE'

export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'CONTACTED' | 'REPLIED' | 'CLOSED' | 'DISCARDED'

export type BusinessStatus = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | 'FUTURE_OPENING'

export type LeadOrder = 'reviews' | 'rating' | 'name' | 'recent'

export interface Lead {
	id: string
	name: string
	address: string | null
	neighborhood: string | null
	city: string
	state: string | null
	category: string
	searchNeighborhood: string | null
	primaryType: string | null
	primaryTypeName: string | null
	nationalPhone: string | null
	internationalPhone: string | null
	websiteUri: string | null
	siteStatus: SiteStatus
	rating: number | null
	userRatingCount: number | null
	googleMapsUri: string | null
	businessStatus: BusinessStatus | null
	types: string[]
	pureServiceArea: boolean | null
	openingHours: string[]
	priceLevel: string | null
	reviewsUri: string | null
	photosUri: string | null
	status: LeadStatus
	notes: string | null
	firstSeenAt: string
	lastSeenAt: string
}

export interface LeadFilters {
	siteStatus: SiteStatus[]
	status: LeadStatus[]
	businessStatus: BusinessStatus[]
	minRating: string
	minReviews: string
	city: string
	category: string
	neighborhood: string
	q: string
	orderBy: LeadOrder
}

export interface LeadPage {
	items: Lead[]
	total: number
	page: number
	pageSize: number
}

export interface LeadFilterOptions {
	cities: string[]
	categories: string[]
	neighborhoods: string[]
}
