import { useEffect } from 'react'
import { useUsageStore } from 'src/store/usageStore'

export default function UsageBadge() {
	const { usage, error, refresh } = useUsageStore()

	useEffect(() => {
		refresh()
	}, [refresh])

	if (error) {
		return <span className='rounded-md bg-red-100 px-3 py-1 text-sm text-red-800'>Backend indisponível</span>
	}
	if (!usage) return null

	const tone =
		usage.remaining === 0
			? 'bg-red-100 text-red-800'
			: usage.remaining < 100
				? 'bg-amber-100 text-amber-800'
				: 'bg-emerald-100 text-emerald-800'

	return (
		<span
			className={`rounded-md px-3 py-1 text-sm font-medium ${tone}`}
			title={`Mês de cobrança ${usage.period} (horário do Pacífico). A trava é de ${usage.limit} requisições.`}
		>
			{usage.used}/{usage.limit} requisições · restam {usage.remaining}
		</span>
	)
}
