import { api } from './_api'
import type { ApiToken, CreatedApiToken } from 'src/types'

export async function fetchApiTokens() {
	const { data } = await api.get<ApiToken[]>('/me/tokens')
	return data
}

/** Cria um token pessoal. A resposta é a única vez em que o valor completo aparece. */
export async function createApiToken(name: string) {
	const { data } = await api.post<CreatedApiToken>('/me/tokens', { name })
	return data
}

/** Revoga o token: ele para de funcionar na hora. */
export async function revokeApiToken(id: number) {
	await api.delete(`/me/tokens/${id}`)
}
