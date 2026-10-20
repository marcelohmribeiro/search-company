export interface ApiToken {
	id: number
	name: string
	lastChars: string
	createdAt: string
	lastUsedAt: string | null
}

export interface CreatedApiToken extends ApiToken {
	/** Valor completo, devolvido só na criação. */
	token: string
}
