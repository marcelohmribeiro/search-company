import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ApiKeyState {
	/** Chave da API do Google enviada em cada busca. O backend não a guarda. */
	apiKey: string
	/** Com `true`, a chave fica no localStorage deste navegador; senão, só na memória até recarregar. */
	remember: boolean
	setApiKey: (apiKey: string) => void
	setRemember: (remember: boolean) => void
}

const useApiKeyStore = create<ApiKeyState>()(
	persist(
		(set) => ({
			apiKey: '',
			remember: false,
			setApiKey: (apiKey) => set({ apiKey }),
			setRemember: (remember) => set({ remember }),
		}),
		{
			name: 'search-company:google-api-key',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => (state.remember ? { apiKey: state.apiKey, remember: true } : { remember: false }),
		},
	),
)

export default useApiKeyStore
export { useApiKeyStore }
