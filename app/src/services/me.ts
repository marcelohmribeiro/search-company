import { api } from './_api'
import type { AuthUser } from 'src/types'

/** Dados do usuário logado. Registra uma entrada no app. */
export async function fetchMe() {
	const { data } = await api.get<AuthUser>('/me')
	return data
}

/** Altera o nome que entra no lugar de `{{vendedor}}` nas mensagens. */
export async function updateMe(changes: { displayName: string | null }) {
	const { data } = await api.patch<AuthUser>('/me', changes)
	return data
}
