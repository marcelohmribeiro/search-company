import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, PanelRightOpen, SearchX, Star, StickyNote } from 'lucide-react'
import LeadStatusSelect from 'src/components/leads/LeadStatusSelect'
import SiteStatusBadge from 'src/components/leads/SiteStatusBadge'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Skeleton } from 'src/components/ui/skeleton'
import { Spinner } from 'src/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip'
import { businessStatusLabel } from 'src/constants/labels'
import { formatNumber, formatRating } from 'src/lib/format'
import { whatsappUrl } from 'src/lib/phone'
import type { Lead, LeadStatus } from 'src/types'

const SKELETON_ROWS = 8

interface LeadsTableProps {
	leads: Lead[]
	total: number
	page: number
	pageSize: number
	/** Primeira carga, sem dados para mostrar. */
	loading: boolean
	/** Recarga com dados antigos ainda na tela. */
	refreshing: boolean
	onPageChange: (page: number) => void
	onOpen: (lead: Lead) => void
	onStatusChange: (lead: Lead, status: LeadStatus) => void
	onResetFilters: () => void
}

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant='ghost' size='icon-sm' asChild>
					<a href={href} target='_blank' rel='noreferrer' aria-label={label}>
						{children}
					</a>
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	)
}

function Rating({ lead }: { lead: Lead }) {
	if (lead.rating == null) return <span className='text-muted-foreground'>—</span>
	return (
		<span className='inline-flex items-center gap-1 whitespace-nowrap tabular-nums'>
			<Star className='size-3.5 fill-amber-400 text-amber-400' />
			<span className='font-medium'>{formatRating(lead.rating)}</span>
			<span className='text-muted-foreground'>({formatNumber(lead.userRatingCount ?? 0)})</span>
		</span>
	)
}

export default function LeadsTable({
	leads,
	total,
	page,
	pageSize,
	loading,
	refreshing,
	onPageChange,
	onOpen,
	onStatusChange,
	onResetFilters,
}: LeadsTableProps) {
	const pages = Math.max(1, Math.ceil(total / pageSize))
	const first = total ? (page - 1) * pageSize + 1 : 0
	const last = Math.min(page * pageSize, total)

	if (!loading && leads.length === 0) {
		return (
			<Card>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<SearchX />
						</EmptyMedia>
						<EmptyTitle>Nenhum lead encontrado</EmptyTitle>
						<EmptyDescription>Nenhuma empresa atende a esses filtros. Faça uma busca ou ajuste os filtros.</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant='outline' onClick={onResetFilters}>
							Limpar filtros
						</Button>
					</EmptyContent>
				</Empty>
			</Card>
		)
	}

	return (
		<Card className='gap-0 py-0'>
			<Table className={refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
				<TableHeader className='bg-muted/50'>
					<TableRow>
						<TableHead className='pl-4'>Empresa</TableHead>
						<TableHead>Bairro</TableHead>
						<TableHead>Avaliação</TableHead>
						<TableHead>Site</TableHead>
						<TableHead>Telefone</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className='pr-4 text-right'>Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading
						? Array.from({ length: SKELETON_ROWS }, (_, index) => (
								<TableRow key={index}>
									<TableCell className='pl-4'>
										<Skeleton className='mb-1.5 h-4 w-48' />
										<Skeleton className='h-3 w-24' />
									</TableCell>
									{Array.from({ length: 5 }, (_, cell) => (
										<TableCell key={cell}>
											<Skeleton className='h-4 w-20' />
										</TableCell>
									))}
									<TableCell className='pr-4'>
										<Skeleton className='ml-auto h-7 w-24' />
									</TableCell>
								</TableRow>
							))
						: leads.map((lead) => {
								const whatsapp = whatsappUrl(lead.internationalPhone)
								const closed = lead.businessStatus && lead.businessStatus !== 'OPERATIONAL'
								return (
									<TableRow key={lead.id}>
										<TableCell className='max-w-72 pl-4'>
											<button
												onClick={() => onOpen(lead)}
												className='block max-w-full truncate text-left font-medium hover:underline'
											>
												{lead.name}
											</button>
											<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
												<span className='truncate'>{lead.primaryTypeName ?? lead.category}</span>
												{closed && (
													<Badge variant='outline' className='h-4 border-red-200 bg-red-50 px-1.5 text-[0.65rem] text-red-700'>
														{businessStatusLabel(lead.businessStatus)}
													</Badge>
												)}
											</div>
											{lead.notes && (
												<p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
													<StickyNote className='size-3 shrink-0' />
													<span className='truncate'>{lead.notes}</span>
												</p>
											)}
										</TableCell>
										<TableCell className='text-muted-foreground'>
											{lead.neighborhood ?? lead.searchNeighborhood ?? '—'}
										</TableCell>
										<TableCell>
											<Rating lead={lead} />
										</TableCell>
										<TableCell>
											<SiteStatusBadge status={lead.siteStatus} />
										</TableCell>
										<TableCell className='tabular-nums'>
											{lead.nationalPhone ?? <span className='text-muted-foreground'>—</span>}
										</TableCell>
										<TableCell>
											<LeadStatusSelect
												value={lead.status}
												onChange={(status) => onStatusChange(lead, status)}
												size='sm'
												className='w-36'
											/>
										</TableCell>
										<TableCell className='pr-4'>
											<div className='flex justify-end gap-0.5'>
												{lead.googleMapsUri && (
													<IconLink href={lead.googleMapsUri} label='Abrir no Google Maps'>
														<MapPin />
													</IconLink>
												)}
												{whatsapp && (
													<IconLink href={whatsapp} label='Conversar no WhatsApp'>
														<MessageCircle className='text-green-600' />
													</IconLink>
												)}
												<Tooltip>
													<TooltipTrigger asChild>
														<Button variant='ghost' size='icon-sm' onClick={() => onOpen(lead)} aria-label='Ver detalhes'>
															<PanelRightOpen />
														</Button>
													</TooltipTrigger>
													<TooltipContent>Ver detalhes</TooltipContent>
												</Tooltip>
											</div>
										</TableCell>
									</TableRow>
								)
							})}
				</TableBody>
			</Table>

			<div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm'>
				<span className='flex items-center gap-2 text-muted-foreground'>
					{refreshing && <Spinner className='size-3.5' />}
					{loading ? 'Carregando…' : `Mostrando ${formatNumber(first)}–${formatNumber(last)} de ${formatNumber(total)}`}
				</span>
				<div className='flex items-center gap-2'>
					<span className='text-muted-foreground tabular-nums'>
						Página {page} de {pages}
					</span>
					<Button
						variant='outline'
						size='icon-sm'
						onClick={() => onPageChange(page - 1)}
						disabled={page <= 1 || loading}
						aria-label='Página anterior'
					>
						<ChevronLeft />
					</Button>
					<Button
						variant='outline'
						size='icon-sm'
						onClick={() => onPageChange(page + 1)}
						disabled={page >= pages || loading}
						aria-label='Próxima página'
					>
						<ChevronRight />
					</Button>
				</div>
			</div>
		</Card>
	)
}
