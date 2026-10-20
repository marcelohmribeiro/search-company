import { api } from './_api'
import type { AuthUser } from 'src/types'

/** Dados do usuário logado. Cada chamada conta como uma entrada no app, que o painel admin mostra. */
export async function fetchMe() {
	const { data } = await api.get<AuthUser>('/me')
	return data
}
