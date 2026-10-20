import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { plural } from 'src/lib/format'
import { getErrorMessage, runSearch } from 'src/services'
import { useUsageStore } from 'src/store/usageStore'
import type { SearchComboProgress, SearchComboStatus, SearchRequest, SearchStatus } from 'src/types'

const COMBO_STATUS: Record<SearchStatus, SearchComboStatus> = {
	RUNNING: 'running',
	DONE: 'done',
	LIMIT_REACHED: 'limit',
	FAILED: 'error',
}

/** Roda as combinações de uma busca em sequência e para no primeiro limite ou erro. */
export function useSearchRunner(onFinish: () => void) {
	const { setUsage, refresh: refreshUsage } = useUsageStore()
	const [running, setRunning] = useState(false)
	const [stopping, setStopping] = useState(false)
	const [city, setCity] = useState('')
	const [progress, setProgress] = useState<SearchComboProgress[]>([])
	const stopRequested = useRef(false)

	const updateItem = (index: number, changes: Partial<SearchComboProgress>) =>
		setProgress((current) => current.map((item, i) => (i === index ? { ...item, ...changes } : item)))

	const stopPending = () =>
		setProgress((current) => current.map((item) => (item.status === 'pending' ? { ...item, status: 'stopped' } : item)))

	async function run({ apiKey, city: cityName, combos, maxPages, skipIfDone }: SearchRequest) {
		stopRequested.current = false
		setStopping(false)
		setRunning(true)
		setCity(cityName)
		setProgress(combos.map((combo) => ({ ...combo, status: 'pending' })))

		let newLeads = 0
		let failure: string | null = null

		for (const [index, { category, neighborhood }] of combos.entries()) {
			if (stopRequested.current) break
			updateItem(index, { status: 'running' })

			try {
				const result = await runSearch({ city: cityName, category, neighborhood, maxPages, skipIfDone }, apiKey)
				const status = result.skipped ? 'skipped' : COMBO_STATUS[result.search.status]
				setUsage(result.usage)
				updateItem(index, { status, search: result.search, message: result.search.error ?? undefined })
				if (!result.skipped) newLeads += result.search.newLeadsCount
				if (status === 'limit' || status === 'error') {
					failure = result.search.error ?? 'A busca parou antes de terminar.'
					break
				}
			} catch (error) {
				failure = getErrorMessage(error)
				updateItem(index, { status: 'error', message: failure })
				break
			}
		}

		stopPending()
		setRunning(false)
		setStopping(false)
		refreshUsage()
		onFinish()

		if (failure) toast.error('A busca parou', { description: failure })
		else toast.success('Busca concluída', { description: plural(newLeads, 'lead novo', 'leads novos') })
	}

	function stop() {
		stopRequested.current = true
		setStopping(true)
	}

	return { running, stopping, city, progress, run, stop }
}
