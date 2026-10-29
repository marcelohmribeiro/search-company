import {
	BUSINESS_STATUS_OPTIONS,
	LEAD_ORDER_OPTIONS,
	LEAD_STATUS_OPTIONS,
	MIN_RATING_OPTIONS,
	PITCH_FILTER_OPTIONS,
	SITE_STATUS_OPTIONS,
} from 'src/constants/labels'
import type { LeadFilters } from 'src/types'

export const PAGE_SIZE_OPTIONS = [25, 50, 100]
export const DEFAULT_PAGE_SIZE = 50

export const DEFAULT_FILTERS: LeadFilters = {
	siteStatus: [],
	status: [],
	businessStatus: [],
	minRating: '',
	minReviews: '',
	city: '',
	category: '',
	neighborhood: '',
	q: '',
	pitch: '',
	orderBy: 'reviews',
}

export interface LeadQuery {
	filters: LeadFilters
	page: number
	pageSize: number
}

const TEXT_KEYS = ['q', 'city', 'category', 'neighborhood'] as const

function readList<T extends string>(params: URLSearchParams, key: string, allowed: { value: T }[]) {
	const raw = params.get(key)
	if (!raw) return []
	const values = allowed.map((option) => option.value)
	return raw.split(',').filter((item): item is T => values.includes(item as T))
}

function readPositiveInt(raw: string | null, fallback: number) {
	const value = Number(raw)
	return Number.isInteger(value) && value >= 1 ? value : fallback
}

/** Lê a query string da tela de leads; valores inválidos voltam ao padrão. */
export function parseLeadQuery(params: URLSearchParams): LeadQuery {
	const minRating = params.get('minRating') ?? ''
	const minReviews = params.get('minReviews') ?? ''
	const orderBy = LEAD_ORDER_OPTIONS.find((option) => option.value === params.get('orderBy'))?.value
	const pageSize = readPositiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE)

	return {
		filters: {
			...DEFAULT_FILTERS,
			...Object.fromEntries(TEXT_KEYS.map((key) => [key, params.get(key) ?? ''])),
			siteStatus: readList(params, 'siteStatus', SITE_STATUS_OPTIONS),
			status: readList(params, 'status', LEAD_STATUS_OPTIONS),
			businessStatus: readList(params, 'businessStatus', BUSINESS_STATUS_OPTIONS),
			minRating: MIN_RATING_OPTIONS.some((option) => option.value === minRating) ? minRating : '',
			minReviews: /^\d+$/.test(minReviews) ? minReviews : '',
			pitch: PITCH_FILTER_OPTIONS.find((option) => option.value === params.get('pitch'))?.value ?? '',
			orderBy: orderBy ?? DEFAULT_FILTERS.orderBy,
		},
		page: readPositiveInt(params.get('page'), 1),
		pageSize: PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
	}
}

/** Monta a query string só com o que difere do padrão. */
export function buildLeadSearchParams({ filters, page, pageSize }: LeadQuery) {
	const params = new URLSearchParams()
	for (const key of TEXT_KEYS) {
		const value = filters[key].trim()
		if (value) params.set(key, value)
	}
	if (filters.siteStatus.length) params.set('siteStatus', filters.siteStatus.join(','))
	if (filters.status.length) params.set('status', filters.status.join(','))
	if (filters.businessStatus.length) params.set('businessStatus', filters.businessStatus.join(','))
	if (filters.minRating) params.set('minRating', filters.minRating)
	if (filters.minReviews) params.set('minReviews', filters.minReviews)
	if (filters.pitch) params.set('pitch', filters.pitch)
	if (filters.orderBy !== DEFAULT_FILTERS.orderBy) params.set('orderBy', filters.orderBy)
	if (page > 1) params.set('page', String(page))
	if (pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(pageSize))
	return params
}

/** Páginas da paginação; `null` é uma reticência. */
export function pageItems(current: number, total: number): (number | null)[] {
	if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
	if (current <= 4) return [1, 2, 3, 4, 5, null, total]
	if (current >= total - 3) return [1, null, total - 4, total - 3, total - 2, total - 1, total]
	return [1, null, current - 1, current, current + 1, null, total]
}
