import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { settings } from 'src/config'
import type { AuthUser } from 'src/types'

interface AuthState {
	/** JWT do login, válido por 7 dias. */
	token: string | null
	user: AuthUser | null
	signIn: (token: string, user: AuthUser) => void
	setUser: (user: AuthUser) => void
	signOut: () => void
}

const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			user: null,
			signIn: (token, user) => set({ token, user }),
			setUser: (user) => set({ user }),
			signOut: () => set({ token: null, user: null }),
		}),
		{
			name: settings.STORAGE_KEYS.auth,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ token: state.token, user: state.user }),
		},
	),
)

export default useAuthStore
export { useAuthStore }
