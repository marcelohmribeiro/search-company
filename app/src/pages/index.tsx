import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from 'src/components/PageHeader'
import SearchForm from 'src/components/search/SearchForm'
import SearchHistoryCard from 'src/components/search/SearchHistoryCard'
import SearchProgressCard from 'src/components/search/SearchProgressCard'
import { plural } from 'src/lib/format'
import { fetchSearches, getErrorMessage, runSearch } from 'src/services'
import { useUsageStore } from 'src/store/usageStore'
import type { Search, SearchComboProgress, SearchComboStatus, SearchRequest } from 'src/types'

export default function Index() {
	const { setUsage, refresh: refreshUsage } = useUsageStore()
	const [running, setRunning] = useState(false)
	const [stopping, setStopping] = useState(false)
	const [city, setCity] = useState('')
	const [progress, setProgress] = useState<SearchComboProgress[]>([])
	const [history, setHistory] = useState<Search[]>([])
	const [historyLoading, setHistoryLoading] = useState(true)
	const [historyError, setHistoryError] = useState<string | null>(null)
	const stopRequested = useRef(false)

	const loadHistory = useCallback(async () => {
		try {
			setHistory(await fetchSearches())
			setHistoryError(null)
		} catch (error) {
			setHistoryError(getErrorMessage(error))
		} finally {
			setHistoryLoading(false)
		}
	}, [])

	useEffect(() => {
		loadHistory()
	}, [loadHistory])

	const updateItem = (index: number, changes: Partial<SearchComboProgress>) =>
		setProgress((current) => current.map((item, i) => (i === index ? { ...item, ...changes } : item)))

	const stopPending = (fromIndex: number) =>
		setProgress((current) =>
			current.map((item, i) => (i >= fromIndex && item.status === 'pending' ? { ...item, status: 'stopped' } : item)),
		)

	async function handleRun({ apiKey, city: cityName, combos, maxPages, skipIfDone }: SearchRequest) {
		stopRequested.current = false
		setStopping(false)
		setRunning(true)
		setCity(cityName)
		setProgress(combos.map((combo) => ({ ...combo, status: 'pending' })))

		let newLeads = 0
		let failure: string | null = null

		for (let index = 0; index < combos.length; index++) {
			if (stopRequested.current) {
				stopPending(index)
				break
			}

			const { category, neighborhood } = combos[index]
			updateItem(index, { status: 'running' })

			try {
				const result = await runSearch({ city: cityName, category, neighborhood, maxPages, skipIfDone }, apiKey)
				setUsage(result.usage)

				const status: SearchComboStatus = result.skipped
					? 'skipped'
					: result.search.status === 'DONE'
						? 'done'
						: result.search.status === 'LIMIT_REACHED'
							? 'limit'
							: 'error'
				if (!result.skipped) newLeads += result.search.newLeadsCount
				updateItem(index, { status, search: result.search, message: result.search.error ?? undefined, csv: result.csv })

				// Um erro do Google (chave inválida, cota por minuto) tende a se repetir e gastaria requisições à toa.
				if (status === 'limit' || status === 'error') {
					failure = result.search.error ?? 'A busca parou antes de terminar.'
					stopPending(index + 1)
					break
				}
			} catch (error) {
				failure = getErrorMessage(error)
				updateItem(index, { status: 'error', message: failure })
				stopPending(index + 1)
				break
			}
		}

		setRunning(false)
		setStopping(false)
		refreshUsage()
		loadHistory()

		if (failure) toast.error('A busca parou', { description: failure })
		else toast.success('Busca concluída', { description: plural(newLeads, 'lead novo', 'leads novos') })
	}

	function handleStop() {
		stopRequested.current = true
		setStopping(true)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Buscar empresas'
				description='Encontre empresas no Google Maps por categoria e bairro. Elas entram na lista de leads.'
			/>

			<div className='grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]'>
				<SearchForm running={running} stopping={stopping} onRun={handleRun} onStop={handleStop} />

				<div className='min-w-0 space-y-6'>
					{progress.length > 0 && <SearchProgressCard city={city} items={progress} running={running} />}
					<SearchHistoryCard searches={history} loading={historyLoading} error={historyError} />
				</div>
			</div>
		</div>
	)
}
