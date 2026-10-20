import { api } from './_api'
import type { ApiToken, CreatedApiToken } from 'src/types'

export async function fetchApiTokens() {
	const { data } = await api.get<ApiToken[]>('/me/tokens')
	return data
}

/** Cria um token; só esta resposta traz o valor completo. */
export async function createApiToken(name: string) {
	const { data } = await api.post<CreatedApiToken>('/me/tokens', { name })
	return data
}

export async function revokeApiToken(id: number) {
	await api.delete(`/me/tokens/${id}`)
}
