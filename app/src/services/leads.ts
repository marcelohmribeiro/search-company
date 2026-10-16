import { api } from './_api'
import { settings } from 'src/config'
import type { Lead, LeadFilterOptions, LeadFilters, LeadPage, LeadStatus } from 'src/types'

/**
 * Query string dos filtros, sem os campos vazios.
 */
export function leadFiltersToParams(filters: LeadFilters) {
	const params = new URLSearchParams()
	if (filters.siteStatus.length) params.set('siteStatus', filters.siteStatus.join(','))
	if (filters.status.length) params.set('status', filters.status.join(','))
	if (filters.businessStatus.length) params.set('businessStatus', filters.businessStatus.join(','))
	for (const key of ['minRating', 'minReviews', 'city', 'category', 'neighborhood', 'q', 'orderBy'] as const) {
		const value = filters[key].trim()
		if (value) params.set(key, value)
	}
	return params
}

export async function fetchLeads(filters: LeadFilters, page: number, pageSize: number) {
	const params = leadFiltersToParams(filters)
	params.set('page', String(page))
	params.set('pageSize', String(pageSize))
	const { data } = await api.get<LeadPage>('/leads', { params })
	return data
}

export async function fetchLeadFilterOptions() {
	const { data } = await api.get<LeadFilterOptions>('/leads/filters')
	return data
}

export async function updateLead(id: string, changes: { status?: LeadStatus; notes?: string | null }) {
	const { data } = await api.patch<Lead>(`/leads/${encodeURIComponent(id)}`, changes)
	return data
}

export function leadsCsvUrl(filters: LeadFilters) {
	return `${settings.API_URL}/leads/export.csv?${leadFiltersToParams(filters)}`
}
