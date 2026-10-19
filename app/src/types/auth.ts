export type UserRole = 'ADMIN' | 'USER'

/** Usuário logado, como o login e `GET /me` devolvem. A chave do Google nunca vem: só se existe e como termina. */
export interface AuthUser {
	id: number
	email: string
	role: UserRole
	hasGoogleApiKey: boolean
	/** Últimos 4 caracteres da chave salva; `null` sem chave ou quando a API não consegue lê-la. */
	googleApiKeyEnd: string | null
}

export interface LoginResult {
	token: string
	user: AuthUser
}
