import { useEffect } from 'react'
import { CircleAlert } from 'lucide-react'
import { Badge } from 'src/components/ui/badge'
import { Progress } from 'src/components/ui/progress'
import { Skeleton } from 'src/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip'
import { formatNumber } from 'src/lib/format'
import { cn } from 'src/lib/utils'
import { useUsageStore } from 'src/store/usageStore'

export default function UsageMeter() {
	const { usage, error, refresh } = useUsageStore()

	useEffect(() => {
		refresh()
	}, [refresh])

	if (error) {
		return (
			<Badge variant='destructive' className='h-7 gap-1.5 px-2.5'>
				<CircleAlert />
				API indisponível
			</Badge>
		)
	}
	if (!usage) return <Skeleton className='h-9 w-48' />

	const percent = Math.min(100, (usage.used / usage.limit) * 100)
	const indicator =
		usage.remaining === 0
			? '*:data-[slot=progress-indicator]:bg-destructive'
			: usage.remaining < 100
				? '*:data-[slot=progress-indicator]:bg-amber-500'
				: '*:data-[slot=progress-indicator]:bg-emerald-500'

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div tabIndex={0} className='flex w-full cursor-default flex-col gap-1.5 rounded-md outline-none sm:w-48'>
					<div className='flex items-baseline justify-between gap-2 text-xs'>
						<span className='text-muted-foreground'>Requisições do mês</span>
						<span className='font-medium tabular-nums'>
							{formatNumber(usage.used)}
							<span className='text-muted-foreground'> / {formatNumber(usage.limit)}</span>
						</span>
					</div>
					<Progress value={percent} className={cn('h-1.5', indicator)} />
				</div>
			</TooltipTrigger>
			<TooltipContent side='bottom' className='max-w-64'>
				Restam {formatNumber(usage.remaining)} requisições em {usage.period}. O mês segue o horário do Pacífico, como a cota
				grátis do Google.
			</TooltipContent>
		</Tooltip>
	)
}
