import { api } from './_api'
import type { LoginResult } from 'src/types'

export async function login(email: string, password: string) {
	const { data } = await api.post<LoginResult>('/auth/login', { email, password })
	return data
}
