import { create } from 'zustand'

interface LeadsViewState {
	/** Última query string da tela de Leads ("?siteStatus=…&page=2"), ou "" sem filtros. */
	search: string
	setSearch: (search: string) => void
}

/** Guarda os filtros da tela de Leads enquanto o app está aberto, para o menu voltar a eles. */
const useLeadsViewStore = create<LeadsViewState>((set) => ({
	search: '',
	setSearch: (search) => set({ search }),
}))

export default useLeadsViewStore
export { useLeadsViewStore }
