import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ApiKeyState {
	apiKey: string
	/** Com `true`, a chave fica no localStorage; senão, só na memória. */
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
