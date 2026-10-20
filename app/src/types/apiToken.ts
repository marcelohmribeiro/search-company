/** Token pessoal, como `GET /me/tokens` devolve. O valor completo só vem uma vez, na criação. */
export interface ApiToken {
	id: number
	name: string
	/** Últimos 4 caracteres, para reconhecer o token. */
	lastChars: string
	createdAt: string
	lastUsedAt: string | null
}

export interface CreatedApiToken extends ApiToken {
	/** Valor completo (`sc_...`). Não dá para ver de novo depois. */
	token: string
}
