import axios, { isAxiosError } from 'axios'
import { settings } from 'src/config'

const { API_URL } = settings
const api = axios.create({ baseURL: API_URL })

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
