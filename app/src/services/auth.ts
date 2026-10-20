import { api } from './_api'
import type { LoginResult } from 'src/types'

export async function login(username: string, password: string) {
	const { data } = await api.post<LoginResult>('/auth/login', { username, password })
	return data
}

/** Cria a conta e já devolve a sessão, como o login. */
export async function register(username: string, password: string) {
	const { data } = await api.post<LoginResult>('/auth/register', { username, password })
	return data
}
