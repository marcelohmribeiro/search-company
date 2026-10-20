import { api } from './_api'
import type { Search, SearchInput, SearchLeads, SearchResult } from 'src/types'

/** Roda uma busca com a chave no header `X-Google-Api-Key`. */
export async function runSearch(input: SearchInput, apiKey: string) {
	const { data } = await api.post<SearchResult>('/searches', input, { headers: { 'X-Google-Api-Key': apiKey } })
	return data
}

export async function fetchSearches() {
	const { data } = await api.get<Search[]>('/searches')
	return data
}

export async function fetchSearchLeads(id: number) {
	const { data } = await api.get<SearchLeads>(`/searches/${id}/leads`)
	return data
}
