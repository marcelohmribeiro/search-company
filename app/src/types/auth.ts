export type UserRole = 'ADMIN' | 'USER'

/** Usuário logado, como o login, o cadastro e `GET /me` devolvem. */
export interface AuthUser {
	id: number
	username: string
	role: UserRole
}

export interface LoginResult {
	token: string
	user: AuthUser
}
