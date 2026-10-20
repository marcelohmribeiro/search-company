import { api } from './_api'
import type { AuthUser } from 'src/types'

/** Dados do usuário logado. Registra uma entrada no app. */
export async function fetchMe() {
	const { data } = await api.get<AuthUser>('/me')
	return data
}
