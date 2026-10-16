import { useEffect, useState } from 'react'
import LeadDetailModal from 'src/components/LeadDetailModal'
import SiteStatusBadge from 'src/components/SiteStatusBadge'
import { BUSINESS_STATUS_OPTIONS, LEAD_STATUS_OPTIONS, SITE_STATUS_OPTIONS, businessStatusLabel } from 'src/constants/labels'
import { useDebouncedValue } from 'src/hooks/useDebouncedValue'
import { whatsappUrl } from 'src/lib/phone'
import { fetchLeadFilterOptions, fetchLeads, getErrorMessage, leadsCsvUrl, updateLead } from 'src/services'
import type {
	BusinessStatus,
	Lead,
	LeadFilterOptions,
	LeadFilters,
	LeadOrder,
	LeadPage,
	LeadStatus,
	SiteStatus,
} from 'src/types'

const PAGE_SIZE = 50

const DEFAULT_FILTERS: LeadFilters = {
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

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

const chipClass = (active: boolean) =>
	`rounded-full border px-3 py-1 text-xs font-medium ${active ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-600'}`

export default function Leads() {
	const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS)
	const [page, setPage] = useState(1)
	const [data, setData] = useState<LeadPage | null>(null)
	const [options, setOptions] = useState<LeadFilterOptions>({ cities: [], categories: [], neighborhoods: [] })
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<Lead | null>(null)
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

	const changeFilters = (changes: Partial<LeadFilters>) => {
		setFilters((current) => ({ ...current, ...changes }))
		setPage(1)
	}

	const replaceLead = (lead: Lead) =>
		setData((current) => current && { ...current, items: current.items.map((item) => (item.id === lead.id ? lead : item)) })

	async function changeStatus(lead: Lead, status: LeadStatus) {
		replaceLead({ ...lead, status })
		try {
			replaceLead(await updateLead(lead.id, { status }))
		} catch (statusError) {
			replaceLead(lead)
			setError(getErrorMessage(statusError))
		}
	}

	const total = data?.total ?? 0
	const firstItem = total ? (page - 1) * PAGE_SIZE + 1 : 0
	const lastItem = Math.min(page * PAGE_SIZE, total)

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h1 className='text-xl font-semibold'>Leads</h1>
				<a href={leadsCsvUrl(filters)} className='rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium'>
					Exportar CSV
				</a>
			</div>

			<section className='space-y-3 rounded-lg border border-zinc-200 bg-white p-4'>
				<div className='flex flex-wrap items-center gap-2'>
					<span className='w-24 text-sm text-zinc-500'>Site</span>
					{SITE_STATUS_OPTIONS.map((option) => (
						<button
							key={option.value}
							onClick={() => changeFilters({ siteStatus: toggle<SiteStatus>(filters.siteStatus, option.value) })}
							className={chipClass(filters.siteStatus.includes(option.value))}
						>
							{option.label}
						</button>
					))}
				</div>
				<div className='flex flex-wrap items-center gap-2'>
					<span className='w-24 text-sm text-zinc-500'>Status</span>
					{LEAD_STATUS_OPTIONS.map((option) => (
						<button
							key={option.value}
							onClick={() => changeFilters({ status: toggle<LeadStatus>(filters.status, option.value) })}
							className={chipClass(filters.status.includes(option.value))}
						>
							{option.label}
						</button>
					))}
					{filters.status.length > 0 && <span className='text-xs text-zinc-400'>Nenhum marcado mostra todos.</span>}
				</div>
				<div className='flex flex-wrap items-center gap-2'>
					<span className='w-24 text-sm text-zinc-500'>Funcionamento</span>
					{BUSINESS_STATUS_OPTIONS.map((option) => (
						<button
							key={option.value}
							onClick={() =>
								changeFilters({ businessStatus: toggle<BusinessStatus>(filters.businessStatus, option.value) })
							}
							className={chipClass(filters.businessStatus.includes(option.value))}
						>
							{option.label}
						</button>
					))}
					{filters.businessStatus.length > 0 && (
						<span className='text-xs text-zinc-400'>Nenhum marcado mostra todos.</span>
					)}
				</div>
				<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
					<input
						value={filters.q}
						onChange={(event) => changeFilters({ q: event.target.value })}
						placeholder='Nome da empresa'
						className='rounded-md border border-zinc-300 px-3 py-2 text-sm'
					/>
					<select
						value={filters.city}
						onChange={(event) => changeFilters({ city: event.target.value })}
						className='rounded-md border border-zinc-300 px-3 py-2 text-sm'
					>
						<option value=''>Todas as cidades</option>
						{options.cities.map((city) => (
							<option key={city}>{city}</option>
						))}
					</select>
					<select
						value={filters.category}
						onChange={(event) => changeFilters({ category: event.target.value })}
						className='rounded-md border border-zinc-300 px-3 py-2 text-sm'
					>
						<option value=''>Todas as categorias</option>
						{options.categories.map((category) => (
							<option key={category}>{category}</option>
						))}
					</select>
					<select
						value={filters.neighborhood}
						onChange={(event) => changeFilters({ neighborhood: event.target.value })}
						className='rounded-md border border-zinc-300 px-3 py-2 text-sm'
					>
						<option value=''>Todos os bairros</option>
						{options.neighborhoods.map((neighborhood) => (
							<option key={neighborhood}>{neighborhood}</option>
						))}
					</select>
					<select
						value={filters.minRating}
						onChange={(event) => changeFilters({ minRating: event.target.value })}
						className='rounded-md border border-zinc-300 px-3 py-2 text-sm'
					>
						<option value=''>Qualquer nota</option>
						<option value='3.5'>Nota 3,5+</option>
						<option value='4'>Nota 4,0+</option>
						<option value='4.5'>Nota 4,5+</option>
					</select>
					<input
						type='number'
						min={0}
						value={filters.minReviews}
						onChange={(event) => changeFilters({ minReviews: event.target.value })}
						placeholder='Mín. de avaliações'
						className='rounded-md border border-zinc-300 px-3 py-2 text-sm'
					/>
					<select
						value={filters.orderBy}
						onChange={(event) => changeFilters({ orderBy: event.target.value as LeadOrder })}
						className='rounded-md border border-zinc-300 px-3 py-2 text-sm'
					>
						<option value='reviews'>Mais avaliações</option>
						<option value='rating'>Maior nota</option>
						<option value='name'>Nome</option>
						<option value='recent'>Mais recentes</option>
					</select>
					<button onClick={() => changeFilters(DEFAULT_FILTERS)} className='rounded-md border border-zinc-300 px-3 py-2 text-sm'>
						Limpar filtros
					</button>
				</div>
			</section>

			{error && <p className='rounded-md bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

			<section className='overflow-x-auto rounded-lg border border-zinc-200 bg-white'>
				<table className='w-full text-left text-sm'>
					<thead className='border-b border-zinc-200 text-zinc-500'>
						<tr>
							<th className='px-4 py-3 font-medium'>Empresa</th>
							<th className='px-4 py-3 font-medium'>Bairro</th>
							<th className='px-4 py-3 font-medium'>Nota</th>
							<th className='px-4 py-3 font-medium'>Site</th>
							<th className='px-4 py-3 font-medium'>Telefone</th>
							<th className='px-4 py-3 font-medium'>Status</th>
							<th className='px-4 py-3 font-medium'>Ações</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-zinc-100'>
						{data?.items.map((lead) => {
							const whatsapp = whatsappUrl(lead.internationalPhone)
							return (
								<tr key={lead.id} className='align-top'>
									<td className='px-4 py-3'>
										<button onClick={() => setSelected(lead)} className='text-left font-medium hover:underline'>
											{lead.name}
										</button>
										<p className='text-xs text-zinc-500'>{lead.primaryTypeName ?? lead.category}</p>
										{lead.businessStatus && lead.businessStatus !== 'OPERATIONAL' && (
											<p className='text-xs font-medium text-red-700'>{businessStatusLabel(lead.businessStatus)}</p>
										)}
										{lead.notes && <p className='mt-1 line-clamp-2 text-xs text-zinc-600'>{lead.notes}</p>}
									</td>
									<td className='px-4 py-3'>{lead.neighborhood ?? lead.searchNeighborhood ?? '—'}</td>
									<td className='px-4 py-3 whitespace-nowrap'>
										{lead.rating != null ? (
											<>
												{lead.rating.toFixed(1)} <span className='text-zinc-500'>({lead.userRatingCount ?? 0})</span>
											</>
										) : (
											'—'
										)}
									</td>
									<td className='px-4 py-3'>
										<SiteStatusBadge status={lead.siteStatus} />
									</td>
									<td className='px-4 py-3 whitespace-nowrap'>{lead.nationalPhone ?? '—'}</td>
									<td className='px-4 py-3'>
										<select
											value={lead.status}
											onChange={(event) => changeStatus(lead, event.target.value as LeadStatus)}
											className='rounded-md border border-zinc-300 px-2 py-1 text-sm'
										>
											{LEAD_STATUS_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</td>
									<td className='px-4 py-3 whitespace-nowrap'>
										<div className='flex gap-2'>
											{lead.googleMapsUri && (
												<a href={lead.googleMapsUri} target='_blank' rel='noreferrer' className='text-blue-700 underline'>
													Maps
												</a>
											)}
											{whatsapp && (
												<a href={whatsapp} target='_blank' rel='noreferrer' className='text-green-700 underline'>
													WhatsApp
												</a>
											)}
											<button onClick={() => setSelected(lead)} className='text-zinc-700 underline'>
												Detalhes
											</button>
										</div>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
				{!loading && data?.items.length === 0 && (
					<p className='p-6 text-center text-sm text-zinc-500'>Nenhum lead com esses filtros.</p>
				)}
			</section>

			<div className='flex items-center justify-between text-sm text-zinc-600'>
				<span>{loading ? 'Carregando…' : `Mostrando ${firstItem}–${lastItem} de ${total}`}</span>
				<div className='flex gap-2'>
					<button
						onClick={() => setPage((current) => current - 1)}
						disabled={page === 1 || loading}
						className='rounded-md border border-zinc-300 bg-white px-3 py-1.5 disabled:opacity-40'
					>
						Anterior
					</button>
					<button
						onClick={() => setPage((current) => current + 1)}
						disabled={lastItem >= total || loading}
						className='rounded-md border border-zinc-300 bg-white px-3 py-1.5 disabled:opacity-40'
					>
						Próxima
					</button>
				</div>
			</div>

			{selected && <LeadDetailModal lead={selected} onClose={() => setSelected(null)} onSaved={replaceLead} />}
		</div>
	)
}
