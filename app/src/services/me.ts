import { api } from './_api'
import type { AuthUser } from 'src/types'

/** Dados do usuário logado. Cada chamada conta como uma entrada no app, que o painel admin mostra. */
export async function fetchMe() {
	const { data } = await api.get<AuthUser>('/me')
	return data
}

/** Salva a chave da API do Google na conta, cifrada. A resposta só diz como ela termina. */
export async function saveGoogleApiKey(apiKey: string) {
	const { data } = await api.put<AuthUser>('/me/google-api-key', { apiKey })
	return data
}

export async function removeGoogleApiKey() {
	const { data } = await api.delete<AuthUser>('/me/google-api-key')
	return data
}
