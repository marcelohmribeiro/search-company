import { create } from 'zustand'
import { fetchUsage, getErrorMessage } from 'src/services'
import type { Usage } from 'src/types'

interface UsageState {
	usage: Usage | null
	error: string | null
	refresh: () => Promise<void>
	setUsage: (usage: Usage) => void
}

const useUsageStore = create<UsageState>((set) => ({
	usage: null,
	error: null,

	refresh: async () => {
		try {
			set({ usage: await fetchUsage(), error: null })
		} catch (error) {
			set({ error: getErrorMessage(error) })
		}
	},

	setUsage: (usage) => set({ usage, error: null }),
}))

export default useUsageStore
export { useUsageStore }
