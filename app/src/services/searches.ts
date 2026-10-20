import { api } from './_api'
import type { Search, SearchInput, SearchResult } from 'src/types'

/**
 * Roda uma busca no backend. Pode gastar até `maxPages` requisições da cota do mês.
 * `apiKey` vai no header `X-Google-Api-Key`, fora do corpo e da URL, e o backend só a repassa ao Google.
 */
export async function runSearch(input: SearchInput, apiKey: string) {
	const { data } = await api.post<SearchResult>('/searches', input, { headers: { 'X-Google-Api-Key': apiKey } })
	return data
}

export async function fetchSearches() {
	const { data } = await api.get<Search[]>('/searches')
	return data
}
