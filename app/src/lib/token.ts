/** Validade do JWT em milissegundos, ou `null` se o token não for um JWT. */
function tokenExpiry(token: string) {
	try {
		const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
		const { exp } = JSON.parse(atob(payload))
		return typeof exp === 'number' ? exp * 1000 : null
	} catch {
		return null
	}
}

/** Indica token com formato de JWT e no prazo. A assinatura só a API confere. */
export function isTokenActive(token: string | null): token is string {
	const expiry = token ? tokenExpiry(token) : null
	return expiry !== null && expiry > Date.now()
}
