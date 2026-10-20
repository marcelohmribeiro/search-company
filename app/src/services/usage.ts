import { api } from './_api'
import type { Usage } from 'src/types'

/**
 * Uso do mês. Com `apiKey`, inclui o que outras contas fizeram com a mesma chave, como a trava do backend conta.
 */
export async function fetchUsage(apiKey?: string) {
	const headers = apiKey ? { 'X-Google-Api-Key': apiKey } : undefined
	const { data } = await api.get<Usage>('/usage', { headers })
	return data
}
