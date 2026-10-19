/** Prazo do JWT (`exp` do payload) em milissegundos, ou `null` se o token não tiver esse formato. */
function tokenExpiry(token: string) {
	try {
		const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
		const { exp } = JSON.parse(atob(payload))
		return typeof exp === 'number' ? exp * 1000 : null
	} catch {
		return null
	}
}

/**
 * Indica um token com formato de JWT e ainda no prazo.
 * A assinatura não é conferida aqui: quem confere é a API, que responde 401 a um token falso.
 */
export function isTokenActive(token: string | null): token is string {
	const expiry = token ? tokenExpiry(token) : null
	return expiry !== null && expiry > Date.now()
}
