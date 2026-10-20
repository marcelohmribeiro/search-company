export type UserRole = 'ADMIN' | 'USER'

export interface AuthUser {
	id: number
	username: string
	role: UserRole
}

export interface LoginResult {
	token: string
	user: AuthUser
}
