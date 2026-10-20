import { api } from './_api'
import type { LoginResult } from 'src/types'

export async function login(email: string, password: string) {
	const { data } = await api.post<LoginResult>('/auth/login', { email, password })
	return data
}

/** Cria a conta e já devolve a sessão, como o login. */
export async function register(email: string, password: string) {
	const { data } = await api.post<LoginResult>('/auth/register', { email, password })
	return data
}
