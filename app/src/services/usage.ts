import { api } from './_api'
import type { Usage } from 'src/types'

/** Uso do mês; com `apiKey`, inclui o uso dessa chave em outras contas. */
export async function fetchUsage(apiKey?: string) {
	const headers = apiKey ? { 'X-Google-Api-Key': apiKey } : undefined
	const { data } = await api.get<Usage>('/usage', { headers })
	return data
}
