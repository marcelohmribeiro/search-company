import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { settings } from 'src/config'

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
			name: settings.STORAGE_KEYS.googleApiKey,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => (state.remember ? { apiKey: state.apiKey, remember: true } : { remember: false }),
		},
	),
)

export default useApiKeyStore
export { useApiKeyStore }
