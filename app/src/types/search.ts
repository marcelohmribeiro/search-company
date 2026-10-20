import type { Lead } from './lead'

export type SearchStatus = 'RUNNING' | 'DONE' | 'LIMIT_REACHED' | 'FAILED'

export interface Usage {
	period: string
	used: number
	limit: number
	remaining: number
}

export interface Search {
	id: number
	city: string
	category: string
	neighborhood: string | null
	textQuery: string
	maxPages: number
	pagesFetched: number
	resultsCount: number
	newLeadsCount: number
	exhausted: boolean
	status: SearchStatus
	error: string | null
	createdAt: string
	finishedAt: string | null
}

export interface SearchInput {
	city: string
	category: string
	neighborhood?: string
	maxPages: number
	skipIfDone: boolean
}

export interface SearchResult {
	skipped: boolean
	search: Search
	usage: Usage
}

export interface SearchCombo {
	category: string
	neighborhood?: string
}

export type SearchComboStatus = 'pending' | 'running' | 'done' | 'skipped' | 'limit' | 'error' | 'stopped'

export interface SearchComboProgress extends SearchCombo {
	status: SearchComboStatus
	search?: Search
	message?: string
}

export interface SearchRequest {
	apiKey: string
	city: string
	combos: SearchCombo[]
	maxPages: number
	skipIfDone: boolean
}

export interface SearchLead extends Lead {
	page: number
	/** `true` se essa busca colocou a empresa na lista do usuário. */
	isNew: boolean
}

export interface SearchLeads {
	search: Search
	items: SearchLead[]
}
