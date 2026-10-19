export interface AuthUser {
	id: number
	email: string
}

export interface LoginResult {
	token: string
	user: AuthUser
}
