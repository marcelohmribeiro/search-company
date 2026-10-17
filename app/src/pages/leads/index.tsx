import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router'
import { CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from 'src/components/PageHeader'
import LeadDetailSheet from 'src/components/leads/LeadDetailSheet'
import LeadFilters from 'src/components/leads/LeadFilters'
import LeadsTable from 'src/components/leads/LeadsTable'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { plural } from 'src/lib/format'
import { buildLeadSearchParams, parseLeadQuery } from 'src/lib/leadQuery'
import type { LeadQuery } from 'src/lib/leadQuery'
import { fetchLeadFilterOptions, fetchLeads, getErrorMessage, updateLead } from 'src/services'
import { useLeadsViewStore } from 'src/store/leadsViewStore'
import type { Lead, LeadFilterOptions, LeadFilters as Filters, LeadPage, LeadStatus } from 'src/types'

// Campos digitados: a URL (e a busca na API) só muda depois de uma pausa na digitação.
type TextFilters = Pick<Filters, 'q' | 'minReviews'>
const TEXT_DEBOUNCE_MS = 300

export default function Leads() {
	const [searchParams, setSearchParams] = useSearchParams()
	const location = useLocation()
	const navigationType = useNavigationType()
	const setLastSearch = useLeadsViewStore((state) => state.setSearch)

	const search = searchParams.toString()
	const query = useMemo(() => parseLeadQuery(new URLSearchParams(search)), [search])
	const { filters, page, pageSize } = query

	const [text, setText] = useState<TextFilters>({ q: filters.q, minReviews: filters.minReviews })
	const pendingText = useRef<Partial<TextFilters>>({})
	const textTimer = useRef<number | undefined>(undefined)

	const [data, setData] = useState<LeadPage | null>(null)
	const [options, setOptions] = useState<LeadFilterOptions>({ cities: [], categories: [], neighborhoods: [] })
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<Lead | null>(null)
	const [sheetOpen, setSheetOpen] = useState(false)

	/** Aplica uma mudança sobre a query atual da URL. `push` cria uma entrada no histórico do navegador. */
	const updateQuery = useCallback(
		(change: (current: LeadQuery) => LeadQuery, { push = false } = {}) =>
			setSearchParams((current) => buildLeadSearchParams(change(parseLeadQuery(current))), { replace: !push }),
		[setSearchParams],
	)

	useEffect(() => {
		setLastSearch(location.search)
	}, [location.search, setLastSearch])

	// Voltar e avançar no navegador trocam a URL sem passar pelos campos digitados.
	useEffect(() => {
		if (navigationType === 'POP') setText({ q: filters.q, minReviews: filters.minReviews })
	}, [location.key, navigationType, filters.q, filters.minReviews])

	useEffect(() => () => window.clearTimeout(textTimer.current), [])

	useEffect(() => {
		fetchLeadFilterOptions()
			.then(setOptions)
			.catch((optionsError) => setError(getErrorMessage(optionsError)))
	}, [])

	useEffect(() => {
		let ignore = false
		setLoading(true)
		fetchLeads(query.filters, query.page, query.pageSize)
			.then((result) => {
				if (ignore) return
				setData(result)
				setError(null)
			})
			.catch((leadsError) => !ignore && setError(getErrorMessage(leadsError)))
			.finally(() => !ignore && setLoading(false))
		return () => {
			ignore = true
		}
	}, [query])

	// Uma URL antiga pode apontar para uma página que não existe mais com os filtros atuais.
	useEffect(() => {
		if (!data) return
		const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize))
		if (page > lastPage) updateQuery((current) => ({ ...current, page: lastPage }))
	}, [data, page, updateQuery])

	const changeFilters = (changes: Partial<Filters>) =>
		updateQuery((current) => ({ ...current, filters: { ...current.filters, ...changes }, page: 1 }))

	function changeText(changes: Partial<TextFilters>) {
		setText((current) => ({ ...current, ...changes }))
		pendingText.current = { ...pendingText.current, ...changes }
		window.clearTimeout(textTimer.current)
		textTimer.current = window.setTimeout(() => {
			const pending = pendingText.current
			pendingText.current = {}
			changeFilters(pending)
		}, TEXT_DEBOUNCE_MS)
	}

	function handleFiltersChange({ q, minReviews, ...rest }: Partial<Filters>) {
		if (q !== undefined) changeText({ q })
		if (minReviews !== undefined) changeText({ minReviews })
		if (Object.keys(rest).length) changeFilters(rest)
	}

	function resetFilters() {
		window.clearTimeout(textTimer.current)
		pendingText.current = {}
		setText({ q: '', minReviews: '' })
		setSearchParams(new URLSearchParams(), { replace: true })
	}

	function changePage(next: number) {
		updateQuery((current) => ({ ...current, page: next }), { push: true })
		document.getElementById('leads-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	const changePageSize = (next: number) => updateQuery((current) => ({ ...current, pageSize: next, page: 1 }))

	const replaceLead = (lead: Lead) =>
		setData((current) => current && { ...current, items: current.items.map((item) => (item.id === lead.id ? lead : item)) })

	async function changeStatus(lead: Lead, status: LeadStatus) {
		replaceLead({ ...lead, status })
		try {
			replaceLead(await updateLead(lead.id, { status }))
		} catch (statusError) {
			replaceLead(lead)
			toast.error('Não foi possível mudar o status', { description: getErrorMessage(statusError) })
		}
	}

	function openLead(lead: Lead) {
		setSelected(lead)
		setSheetOpen(true)
	}

	const total = data?.total ?? 0

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Leads'
				description={data ? `${plural(total, 'empresa encontrada', 'empresas encontradas')} com esses filtros.` : 'Carregando…'}
			/>

			<LeadFilters
				filters={{ ...filters, ...text }}
				options={options}
				onChange={handleFiltersChange}
				onReset={resetFilters}
			/>

			{error && (
				<Alert variant='destructive'>
					<CircleAlert />
					<AlertTitle>Não foi possível carregar os leads</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{!(error && !data) && (
				<LeadsTable
					leads={data?.items ?? []}
					total={total}
					page={page}
					pageSize={pageSize}
					loading={loading && !data}
					refreshing={loading && !!data}
					onPageChange={changePage}
					onPageSizeChange={changePageSize}
					onOpen={openLead}
					onStatusChange={changeStatus}
					onResetFilters={resetFilters}
				/>
			)}

			<LeadDetailSheet lead={selected} open={sheetOpen} onOpenChange={setSheetOpen} onSaved={replaceLead} />
		</div>
	)
}
