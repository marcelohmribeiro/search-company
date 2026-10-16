import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { settings } from 'src/config'
import type { User } from 'src/types'

const { APP_NAME } = settings

interface AuthState {
	user: User | null
	token: string | null
	login: (userData: User, token: string) => void
	updateUser: (userData: User) => void
	logout: () => void
	isAuthenticated: () => boolean
}

const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			token: null,

			login: (userData, token) => {
				set({ user: userData, token })
			},

			updateUser: (userData) => {
				set({ user: userData })
			},

			logout: () => {
				localStorage.removeItem(APP_NAME)
				set({ user: null, token: null })
			},

			isAuthenticated: () => !!get().token,
		}),
		{
			name: APP_NAME,
			partialize: (state) => ({ token: state.token, user: state.user }),
		},
	),
)

export default useAuthStore
export { useAuthStore }
