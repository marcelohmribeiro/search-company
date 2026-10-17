import { Fragment } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Ban, CircleCheck, CircleDashed, CircleX, SkipForward, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from 'src/components/ui/item'
import { Progress } from 'src/components/ui/progress'
import { Spinner } from 'src/components/ui/spinner'
import { plural } from 'src/lib/format'
import { textQuery } from 'src/lib/search'
import { cn } from 'src/lib/utils'
import type { SearchComboProgress, SearchComboStatus } from 'src/types'

const STATUS: Record<SearchComboStatus, { label: string; icon: LucideIcon | null; className: string }> = {
	pending: { label: 'Aguardando', icon: CircleDashed, className: 'text-muted-foreground' },
	running: { label: 'Buscando', icon: null, className: 'text-sky-600' },
	done: { label: 'Concluída', icon: CircleCheck, className: 'text-emerald-600' },
	skipped: { label: 'Pulada', icon: SkipForward, className: 'text-muted-foreground' },
	limit: { label: 'Parou no limite', icon: TriangleAlert, className: 'text-amber-600' },
	error: { label: 'Erro', icon: CircleX, className: 'text-destructive' },
	stopped: { label: 'Não executada', icon: Ban, className: 'text-muted-foreground' },
}

const FINISHED: SearchComboStatus[] = ['done', 'skipped', 'limit', 'error', 'stopped']

function details(item: SearchComboProgress) {
	if (item.message) return item.message
	if (item.status === 'skipped') return 'Já feita antes, sem gastar requisição'
	if (!item.search) return null
	const parts = [
		plural(item.search.pagesFetched, 'página', 'páginas'),
		plural(item.search.newLeadsCount, 'lead novo', 'leads novos'),
	]
	if (item.csv?.file) parts.push(`CSV ${item.csv.file}`)
	return parts.join(' · ')
}

interface SearchProgressCardProps {
	city: string
	items: SearchComboProgress[]
	running: boolean
}

export default function SearchProgressCard({ city, items, running }: SearchProgressCardProps) {
	const finished = items.filter((item) => FINISHED.includes(item.status)).length
	const newLeads = items.reduce((total, item) => total + (item.status === 'skipped' ? 0 : (item.search?.newLeadsCount ?? 0)), 0)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Andamento</CardTitle>
				<CardDescription>
					{finished} de {plural(items.length, 'busca', 'buscas')} · {plural(newLeads, 'lead novo', 'leads novos')}
				</CardDescription>
				<CardAction>
					<Button variant='outline' size='sm' asChild>
						<Link to='/leads'>
							Ver leads
							<ArrowRight />
						</Link>
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent className='space-y-4'>
				<div className='space-y-1.5'>
					<Progress value={(finished / items.length) * 100} />
					{running && (
						<p className='text-xs text-muted-foreground'>
							As chamadas são espaçadas para respeitar a cota por minuto do Google.
						</p>
					)}
				</div>

				<ItemGroup className='gap-0 rounded-lg border has-data-[size=sm]:gap-0'>
					{items.map((item, index) => {
						const status = STATUS[item.status]
						const Icon = status.icon
						const description = details(item)
						return (
							<Fragment key={`${item.category}|${item.neighborhood}`}>
								{index > 0 && <ItemSeparator className='my-0' />}
								<Item size='sm'>
									<ItemMedia variant='icon' className={status.className}>
										{Icon ? <Icon /> : <Spinner />}
									</ItemMedia>
									<ItemContent className='min-w-0'>
										<ItemTitle className='truncate'>{textQuery(item.category, item.neighborhood, city)}</ItemTitle>
										{description && (
											<ItemDescription className={cn(item.status === 'error' && 'text-destructive')}>
												{description}
											</ItemDescription>
										)}
										{item.csv?.error && (
											<ItemDescription className='text-destructive'>Falha ao gravar o CSV: {item.csv.error}</ItemDescription>
										)}
									</ItemContent>
									<ItemActions>
										<Badge variant='outline' className={status.className}>
											{status.label}
										</Badge>
									</ItemActions>
								</Item>
							</Fragment>
						)
					})}
				</ItemGroup>
			</CardContent>
		</Card>
	)
}
