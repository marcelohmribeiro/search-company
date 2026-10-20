import { create } from 'zustand'

interface LeadsViewState {
	search: string
	setSearch: (search: string) => void
}

/** Última query string da tela de leads, para o menu voltar a ela. */
const useLeadsViewStore = create<LeadsViewState>((set) => ({
	search: '',
	setSearch: (search) => set({ search }),
}))

export default useLeadsViewStore
export { useLeadsViewStore }
