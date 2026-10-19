import axios, { isAxiosError } from 'axios'
import { settings } from 'src/config'
import { useAuthStore } from 'src/store/authStore'

const { API_URL } = settings
const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
	const { token } = useAuthStore.getState()
	if (token) config.headers.Authorization = `Bearer ${token}`
	return config
})

// Token ausente, expirado ou inválido: encerra a sessão, e as rotas protegidas mandam para o login.
// No próprio login, o 401 é senha errada e só vira mensagem na tela.
api.interceptors.response.use(undefined, (error) => {
	if (isAxiosError(error) && error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
		useAuthStore.getState().signOut()
	}
	return Promise.reject(error)
})

/**
 * Mensagem de erro para exibir ao usuário: a do backend (`{ error }`) quando existir.
 */
function getErrorMessage(error: unknown): string {
	if (isAxiosError(error)) {
		if (error.response?.data?.error) return error.response.data.error
		if (!error.response) return `Não foi possível falar com o backend em ${API_URL}.`
	}
	return error instanceof Error ? error.message : 'Erro inesperado.'
}

export default api
export { api, getErrorMessage }
