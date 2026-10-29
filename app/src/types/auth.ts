export type UserRole = 'ADMIN' | 'USER'

export interface AuthUser {
	id: number
	username: string
	role: UserRole
	/** Nome que entra no lugar de `{{vendedor}}` nas mensagens. */
	displayName?: string | null
}

export interface LoginResult {
	token: string
	user: AuthUser
}
