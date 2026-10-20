import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthUser } from 'src/types'

interface AuthState {
	/** JWT do login, enviado em todas as chamadas à API. Expira em 7 dias. */
	token: string | null
	user: AuthUser | null
	signIn: (token: string, user: AuthUser) => void
	/** Troca os dados do usuário (usuário, papel) pelos mais recentes da API. */
	setUser: (user: AuthUser) => void
	/** Apaga a sessão; as rotas protegidas voltam para o login. */
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
			name: 'search-company:auth',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ token: state.token, user: state.user }),
		},
	),
)

export default useAuthStore
export { useAuthStore }
