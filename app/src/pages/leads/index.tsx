import { useCallback, useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from 'src/components/PageHeader'
import LeadDetailSheet from 'src/components/leads/LeadDetailSheet'
import LeadFilters from 'src/components/leads/LeadFilters'
import LeadsTable from 'src/components/leads/LeadsTable'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { useApi, useLeadQuery } from 'src/hooks'
import { plural } from 'src/lib/format'
import { fetchLeadFilterOptions, fetchLeads, getErrorMessage, updateLead } from 'src/services'
import type { Lead, LeadFilterOptions, LeadStatus } from 'src/types'

const EMPTY_OPTIONS: LeadFilterOptions = { cities: [], categories: [], neighborhoods: [] }

export default function Leads() {
	const { query, filters, setFilters, resetFilters, setPage, setPageSize } = useLeadQuery()
	const { page, pageSize } = query

	const loadLeads = useCallback(() => fetchLeads(query.filters, query.page, query.pageSize), [query])
	const leads = useApi(loadLeads)
	const options = useApi(fetchLeadFilterOptions)
	const { data, setData } = leads
	const error = leads.error ?? options.error

	const [selected, setSelected] = useState<Lead | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)

	useEffect(() => {
		if (!data) return
		const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize))
		if (page > lastPage) setPage(lastPage, false)
	}, [data, page, setPage])

	const changePage = useCallback(
		(next: number) => {
			setPage(next)
			document.getElementById('leads-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		},
		[setPage],
	)

	const replaceLead = useCallback(
		(lead: Lead) =>
			setData((current) => current && { ...current, items: current.items.map((item) => (item.id === lead.id ? lead : item)) }),
		[setData],
	)

	const changeStatus = useCallback(
		async (lead: Lead, status: LeadStatus) => {
			replaceLead({ ...lead, status })
			try {
				replaceLead(await updateLead(lead.id, { status }))
			} catch (statusError) {
				replaceLead(lead)
				toast.error('Não foi possível mudar o status', { description: getErrorMessage(statusError) })
			}
		},
		[replaceLead],
	)

	const openLead = useCallback((lead: Lead) => {
		setSelected(lead)
		setDetailOpen(true)
	}, [])

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Leads'
				description={
					data ? `${plural(data.total, 'empresa encontrada', 'empresas encontradas')} com esses filtros.` : 'Carregando…'
				}
			/>

			<LeadFilters filters={filters} options={options.data ?? EMPTY_OPTIONS} onChange={setFilters} onReset={resetFilters} />

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
					total={data?.total ?? 0}
					page={page}
					pageSize={pageSize}
					loading={leads.loading && !data}
					refreshing={leads.loading && !!data}
					onPageChange={changePage}
					onPageSizeChange={setPageSize}
					onOpen={openLead}
					onStatusChange={changeStatus}
					onResetFilters={resetFilters}
				/>
			)}

			<LeadDetailSheet lead={selected} open={detailOpen} onOpenChange={setDetailOpen} onSaved={replaceLead} />
		</div>
	)
}
