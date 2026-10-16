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
	/** Última gravação do CSV da cidade. Ausente quando a busca foi pulada. */
	csv?: { file: string | null; error?: string }
}
