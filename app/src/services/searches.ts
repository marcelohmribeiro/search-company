import { api } from './_api'
import type { Search, SearchInput, SearchResult } from 'src/types'

/**
 * Roda uma busca no backend. Pode gastar até `maxPages` requisições da cota do mês.
 */
export async function runSearch(input: SearchInput) {
	const { data } = await api.post<SearchResult>('/searches', input)
	return data
}

export async function fetchSearches() {
	const { data } = await api.get<Search[]>('/searches')
	return data
}
