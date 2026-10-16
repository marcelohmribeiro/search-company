import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SEARCH_STATUS_LABELS } from 'src/constants/labels'
import { fetchSearches, getErrorMessage, runSearch } from 'src/services'
import { useUsageStore } from 'src/store/usageStore'
import type { Search, SearchResult } from 'src/types'

type ComboStatus = 'pending' | 'running' | 'done' | 'skipped' | 'limit' | 'error' | 'stopped'

interface Combo {
	category: string
	neighborhood?: string
	status: ComboStatus
	search?: Search
	message?: string
	csv?: SearchResult['csv']
}

const COMBO_STATUS: Record<ComboStatus, { label: string; className: string }> = {
	pending: { label: 'Aguardando', className: 'text-zinc-500' },
	running: { label: 'Buscando…', className: 'text-blue-700' },
	done: { label: 'Concluída', className: 'text-emerald-700' },
	skipped: { label: 'Já feita, pulada', className: 'text-zinc-500' },
	limit: { label: 'Parou no limite', className: 'text-red-700' },
	error: { label: 'Erro', className: 'text-red-700' },
	stopped: { label: 'Não executada', className: 'text-zinc-400' },
}

/** Itens únicos de um texto separado por linha ou vírgula, sem espaços extras. */
const parseList = (text: string) => [
	...new Set(
		text
			.split(/[\n,]/)
			.map((item) => item.trim().replace(/\s+/g, ' '))
			.filter(Boolean),
	),
]

const textQuery = (category: string, neighborhood: string | undefined, city: string) =>
	neighborhood ? `${category} em ${neighborhood}, ${city}` : `${category} em ${city}`

const formatDate = (iso: string) =>
	new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export default function Index() {
	const { usage, setUsage, refresh: refreshUsage } = useUsageStore()
	const [city, setCity] = useState('')
	const [categoriesText, setCategoriesText] = useState('')
	const [neighborhoodsText, setNeighborhoodsText] = useState('')
	const [maxPages, setMaxPages] = useState(3)
	const [skipIfDone, setSkipIfDone] = useState(true)
	const [running, setRunning] = useState(false)
	const [progress, setProgress] = useState<Combo[]>([])
	const [history, setHistory] = useState<Search[]>([])
	const [historyError, setHistoryError] = useState<string | null>(null)
	const stopRequested = useRef(false)

	const categories = useMemo(() => parseList(categoriesText), [categoriesText])
	const neighborhoods = useMemo(() => parseList(neighborhoodsText), [neighborhoodsText])
	const combos = useMemo(
		() =>
			categories.flatMap((category) =>
				neighborhoods.length
					? neighborhoods.map((neighborhood) => ({ category, neighborhood }))
					: [{ category, neighborhood: undefined }],
			),
		[categories, neighborhoods],
	)
	const cityName = city.trim().replace(/\s+/g, ' ')
	const estimate = combos.length * maxPages
	const remaining = usage?.remaining ?? 0
	const canRun = !running && cityName !== '' && combos.length > 0 && remaining > 0

	const loadHistory = useCallback(async () => {
		try {
			setHistory(await fetchSearches())
			setHistoryError(null)
		} catch (error) {
			setHistoryError(getErrorMessage(error))
		}
	}, [])

	useEffect(() => {
		loadHistory()
	}, [loadHistory])

	const updateCombo = (index: number, changes: Partial<Combo>) =>
		setProgress((current) => current.map((combo, i) => (i === index ? { ...combo, ...changes } : combo)))

	const stopRemaining = (fromIndex: number) =>
		setProgress((current) =>
			current.map((combo, i) => (i >= fromIndex && combo.status === 'pending' ? { ...combo, status: 'stopped' } : combo)),
		)

	async function handleRun() {
		const confirmed = window.confirm(
			`Esta busca pode usar até ${estimate} requisição(ões) da cota do mês (restam ${remaining}).\n\nContinuar?`,
		)
		if (!confirmed) return

		stopRequested.current = false
		setRunning(true)
		setProgress(combos.map((combo) => ({ ...combo, status: 'pending' })))

		for (let index = 0; index < combos.length; index++) {
			if (stopRequested.current) {
				stopRemaining(index)
				break
			}

			const { category, neighborhood } = combos[index]
			updateCombo(index, { status: 'running' })

			try {
				const result = await runSearch({ city: cityName, category, neighborhood, maxPages, skipIfDone })
				setUsage(result.usage)

				const status: ComboStatus = result.skipped
					? 'skipped'
					: result.search.status === 'DONE'
						? 'done'
						: result.search.status === 'LIMIT_REACHED'
							? 'limit'
							: 'error'
				updateCombo(index, { status, search: result.search, message: result.search.error ?? undefined, csv: result.csv })

				// Um erro do Google (chave inválida, cota por minuto) tende a se repetir e gastaria requisições à toa.
				if (status === 'limit' || status === 'error') {
					stopRemaining(index + 1)
					break
				}
			} catch (error) {
				updateCombo(index, { status: 'error', message: getErrorMessage(error) })
				stopRemaining(index + 1)
				break
			}
		}

		setRunning(false)
		refreshUsage()
		loadHistory()
	}

	const newLeads = progress.reduce((total, combo) => total + (combo.status === 'done' || combo.status === 'limit' ? (combo.search?.newLeadsCount ?? 0) : 0), 0)

	return (
		<div className='grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]'>
			<section className='space-y-4 rounded-lg border border-zinc-200 bg-white p-5'>
				<h1 className='text-xl font-semibold'>Nova busca</h1>

				<label className='block space-y-1'>
					<span className='text-sm font-medium'>Cidade</span>
					<input
						value={city}
						onChange={(event) => setCity(event.target.value)}
						placeholder='Ex.: Fortaleza'
						disabled={running}
						className='w-full rounded-md border border-zinc-300 px-3 py-2'
					/>
				</label>

				<label className='block space-y-1'>
					<span className='text-sm font-medium'>Categorias</span>
					<textarea
						value={categoriesText}
						onChange={(event) => setCategoriesText(event.target.value)}
						placeholder={'Uma por linha. Ex.:\nbarbearia\nsalão de beleza'}
						rows={4}
						disabled={running}
						className='w-full rounded-md border border-zinc-300 px-3 py-2'
					/>
				</label>

				<label className='block space-y-1'>
					<span className='text-sm font-medium'>Bairros (opcional)</span>
					<textarea
						value={neighborhoodsText}
						onChange={(event) => setNeighborhoodsText(event.target.value)}
						placeholder={'Um por linha. Sem bairro, a busca é na cidade toda.\nEx.:\nAldeota\nMeireles'}
						rows={4}
						disabled={running}
						className='w-full rounded-md border border-zinc-300 px-3 py-2'
					/>
				</label>

				<div className='flex flex-wrap items-end gap-4'>
					<label className='block space-y-1'>
						<span className='text-sm font-medium'>Páginas por busca</span>
						<select
							value={maxPages}
							onChange={(event) => setMaxPages(Number(event.target.value))}
							disabled={running}
							className='rounded-md border border-zinc-300 px-3 py-2'
						>
							<option value={1}>1 (até 20 empresas)</option>
							<option value={2}>2 (até 40 empresas)</option>
							<option value={3}>3 (até 60 empresas)</option>
						</select>
					</label>
					<label className='flex items-center gap-2 pb-2 text-sm'>
						<input
							type='checkbox'
							checked={skipIfDone}
							onChange={(event) => setSkipIfDone(event.target.checked)}
							disabled={running}
						/>
						Pular buscas já feitas
					</label>
				</div>

				<div className='rounded-md bg-zinc-100 p-3 text-sm'>
					<p>
						{combos.length} busca(s) × {maxPages} página(s) = <strong>até {estimate} requisição(ões)</strong>.
						Restam {remaining} neste mês.
					</p>
					{estimate > remaining && remaining > 0 && (
						<p className='mt-1 text-amber-700'>
							A estimativa passa do que resta: as buscas param quando a cota chegar ao limite.
						</p>
					)}
					{usage && remaining === 0 && (
						<p className='mt-1 text-red-700'>A cota do mês acabou. Novas buscas só no próximo mês.</p>
					)}
					{cityName && combos.length > 0 && (
						<p className='mt-1 text-zinc-500'>
							Ex.: “{textQuery(combos[0].category, combos[0].neighborhood, cityName)}”
						</p>
					)}
				</div>

				<div className='flex gap-2'>
					<button
						onClick={handleRun}
						disabled={!canRun}
						className='rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40'
					>
						Buscar
					</button>
					{running && (
						<button
							onClick={() => (stopRequested.current = true)}
							className='rounded-md border border-zinc-300 px-4 py-2 font-medium'
						>
							Parar depois da atual
						</button>
					)}
				</div>
			</section>

			<div className='space-y-6'>
				{progress.length > 0 && (
					<section className='rounded-lg border border-zinc-200 bg-white p-5'>
						<div className='mb-3 flex flex-wrap items-baseline justify-between gap-2'>
							<h2 className='text-lg font-semibold'>Andamento</h2>
							<p className='text-sm text-zinc-600'>
								{newLeads} lead(s) novo(s) ·{' '}
								<Link to='/leads' className='underline'>
									ver leads
								</Link>
							</p>
						</div>
						{running && (
							<p className='mb-3 text-xs text-zinc-500'>
								O backend espaça as chamadas para respeitar a cota por minuto do Google.
							</p>
						)}
						<ul className='divide-y divide-zinc-100 text-sm'>
							{progress.map((combo, index) => (
								<li key={index} className='flex flex-wrap items-baseline justify-between gap-2 py-2'>
									<span>{textQuery(combo.category, combo.neighborhood, cityName)}</span>
									<span className={COMBO_STATUS[combo.status].className}>
										{COMBO_STATUS[combo.status].label}
										{combo.search && combo.status !== 'skipped' && (
											<> · {combo.search.pagesFetched} pág. · {combo.search.newLeadsCount} novo(s)</>
										)}
										{combo.message && <span className='block text-xs'>{combo.message}</span>}
										{combo.csv?.file && <span className='block text-xs text-zinc-500'>CSV: api/csv/{combo.csv.file}</span>}
										{combo.csv?.error && (
											<span className='block text-xs text-red-700'>Falha ao gravar o CSV: {combo.csv.error}</span>
										)}
									</span>
								</li>
							))}
						</ul>
					</section>
				)}

				<section className='rounded-lg border border-zinc-200 bg-white p-5'>
					<h2 className='mb-3 text-lg font-semibold'>Histórico</h2>
					{historyError && <p className='text-sm text-red-700'>{historyError}</p>}
					{!historyError && history.length === 0 && (
						<p className='text-sm text-zinc-500'>Nenhuma busca feita ainda.</p>
					)}
					{history.length > 0 && (
						<div className='overflow-x-auto'>
							<table className='w-full text-left text-sm'>
								<thead className='text-zinc-500'>
									<tr>
										<th className='py-2 pr-4 font-medium'>Data</th>
										<th className='py-2 pr-4 font-medium'>Busca</th>
										<th className='py-2 pr-4 font-medium'>Situação</th>
										<th className='py-2 pr-4 text-right font-medium'>Páginas</th>
										<th className='py-2 text-right font-medium'>Novos</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-zinc-100'>
									{history.map((search) => (
										<tr key={search.id}>
											<td className='py-2 pr-4 whitespace-nowrap text-zinc-500'>{formatDate(search.createdAt)}</td>
											<td className='py-2 pr-4'>{search.textQuery}</td>
											<td className='py-2 pr-4' title={search.error ?? undefined}>
												{SEARCH_STATUS_LABELS[search.status]}
											</td>
											<td className='py-2 pr-4 text-right'>{search.pagesFetched}</td>
											<td className='py-2 text-right'>{search.newLeadsCount}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</div>
		</div>
	)
}
