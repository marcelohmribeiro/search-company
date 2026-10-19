import { ChevronLeft, ChevronRight, Building2, Star } from 'lucide-react'
import SiteStatusBadge from 'src/components/leads/SiteStatusBadge'
import { Button } from 'src/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Skeleton } from 'src/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { leadStatusOption } from 'src/constants/labels'
import { formatDate, formatNumber, formatRating } from 'src/lib/format'
import { cn } from 'src/lib/utils'
import type { LeadPage } from 'src/types'

interface UserLeadsTableProps {
	/** `null` na primeira carga. */
	data: LeadPage | null
	/** Outra página carregando, com a anterior ainda na tela. */
	refreshing: boolean
	onPageChange: (page: number) => void
}

/** Empresas de um usuário, só para leitura: o admin vê o status e as anotações, mas não altera. */
export default function UserLeadsTable({ data, refreshing, onPageChange }: UserLeadsTableProps) {
	if (!data) {
		return (
			<div className='space-y-2 p-4'>
				{Array.from({ length: 6 }, (_, index) => (
					<Skeleton key={index} className='h-9 w-full' />
				))}
			</div>
		)
	}

	if (data.total === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Building2 />
					</EmptyMedia>
					<EmptyTitle>Nenhuma empresa ainda</EmptyTitle>
					<EmptyDescription>As empresas das buscas desse usuário aparecem aqui.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	const pages = Math.max(1, Math.ceil(data.total / data.pageSize))
	const first = (data.page - 1) * data.pageSize + 1
	const last = Math.min(data.page * data.pageSize, data.total)

	return (
		<>
			<Table className={cn('transition-opacity', refreshing && 'opacity-60')}>
				<TableHeader className='bg-muted/50'>
					<TableRow>
						<TableHead className='pl-4'>Empresa</TableHead>
						<TableHead>Bairro</TableHead>
						<TableHead>Avaliação</TableHead>
						<TableHead>Site</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className='pr-4'>Entrou em</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.items.map((lead) => {
						const status = leadStatusOption(lead.status)
						return (
							<TableRow key={lead.id}>
								<TableCell className='max-w-64 pl-4'>
									<p className='truncate font-medium'>{lead.name}</p>
									<p className='truncate text-xs text-muted-foreground'>{lead.primaryTypeName ?? lead.category}</p>
									{lead.notes && <p className='truncate text-xs text-muted-foreground italic'>{lead.notes}</p>}
								</TableCell>
								<TableCell className='text-muted-foreground'>{lead.neighborhood ?? lead.searchNeighborhood ?? '—'}</TableCell>
								<TableCell>
									{lead.rating == null ? (
										<span className='text-muted-foreground'>—</span>
									) : (
										<span className='inline-flex items-center gap-1 whitespace-nowrap tabular-nums'>
											<Star className='size-3.5 fill-amber-400 text-amber-400' />
											<span className='font-medium'>{formatRating(lead.rating)}</span>
											<span className='text-muted-foreground'>({formatNumber(lead.userRatingCount ?? 0)})</span>
										</span>
									)}
								</TableCell>
								<TableCell>
									<SiteStatusBadge status={lead.siteStatus} />
								</TableCell>
								<TableCell>
									<span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
										<span className={cn('size-2 shrink-0 rounded-full', status.dotClassName)} />
										{status.label}
									</span>
								</TableCell>
								<TableCell className='pr-4 text-muted-foreground tabular-nums'>{formatDate(lead.firstSeenAt)}</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>

			<div className='flex items-center justify-between gap-4 border-t px-4 py-3 text-sm'>
				<span className='text-muted-foreground'>
					Mostrando {formatNumber(first)}–{formatNumber(last)} de {formatNumber(data.total)}
				</span>
				<nav aria-label='Paginação' className='flex items-center gap-1'>
					<Button
						variant='ghost'
						size='icon-sm'
						onClick={() => onPageChange(data.page - 1)}
						disabled={data.page <= 1 || refreshing}
						aria-label='Página anterior'
					>
						<ChevronLeft />
					</Button>
					<span className='px-2 text-muted-foreground tabular-nums'>
						{data.page} de {pages}
					</span>
					<Button
						variant='ghost'
						size='icon-sm'
						onClick={() => onPageChange(data.page + 1)}
						disabled={data.page >= pages || refreshing}
						aria-label='Próxima página'
					>
						<ChevronRight />
					</Button>
				</nav>
			</div>
		</>
	)
}
