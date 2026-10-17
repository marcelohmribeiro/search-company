import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from 'src/components/PageHeader'
import LeadDetailSheet from 'src/components/leads/LeadDetailSheet'
import LeadFilters from 'src/components/leads/LeadFilters'
import LeadsTable from 'src/components/leads/LeadsTable'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { SITE_STATUS_OPTIONS } from 'src/constants/labels'
import { useDebouncedValue } from 'src/hooks/useDebouncedValue'
import { plural } from 'src/lib/format'
import { fetchLeadFilterOptions, fetchLeads, getErrorMessage, updateLead } from 'src/services'
import type { Lead, LeadFilterOptions, LeadFilters as Filters, LeadPage, LeadStatus } from 'src/types'

const PAGE_SIZE = 50

const DEFAULT_FILTERS: Filters = {
	siteStatus: SITE_STATUS_OPTIONS.map((option) => option.value).filter((value) => value !== 'HAS_WEBSITE'),
	status: [],
	businessStatus: [],
	minRating: '',
	minReviews: '',
	city: '',
	category: '',
	neighborhood: '',
	q: '',
	orderBy: 'reviews',
}

export default function Leads() {
	const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
	const [page, setPage] = useState(1)
	const [data, setData] = useState<LeadPage | null>(null)
	const [options, setOptions] = useState<LeadFilterOptions>({ cities: [], categories: [], neighborhoods: [] })
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<Lead | null>(null)
	const [sheetOpen, setSheetOpen] = useState(false)
	const debouncedFilters = useDebouncedValue(filters, 300)

	useEffect(() => {
		fetchLeadFilterOptions()
			.then(setOptions)
			.catch((optionsError) => setError(getErrorMessage(optionsError)))
	}, [])

	useEffect(() => {
		let ignore = false
		setLoading(true)
		fetchLeads(debouncedFilters, page, PAGE_SIZE)
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
	}, [debouncedFilters, page])

	const changeFilters = (changes: Partial<Filters>) => {
		setFilters((current) => ({ ...current, ...changes }))
		setPage(1)
	}

	const resetFilters = () => changeFilters(DEFAULT_FILTERS)

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

			<LeadFilters filters={filters} options={options} onChange={changeFilters} onReset={resetFilters} />

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
					pageSize={PAGE_SIZE}
					loading={loading && !data}
					refreshing={loading && !!data}
					onPageChange={setPage}
					onOpen={openLead}
					onStatusChange={changeStatus}
					onResetFilters={resetFilters}
				/>
			)}

			<LeadDetailSheet lead={selected} open={sheetOpen} onOpenChange={setSheetOpen} onSaved={replaceLead} />
		</div>
	)
}
