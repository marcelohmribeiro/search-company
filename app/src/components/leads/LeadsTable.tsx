import { memo } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Ellipsis, Images, MessageCircle, SearchX, StickyNote } from 'lucide-react'
import InstagramIcon from 'src/components/icons/InstagramIcon'
import LeadRating from 'src/components/leads/LeadRating'
import LeadStatusSelect from 'src/components/leads/LeadStatusSelect'
import SiteStatusBadge from 'src/components/leads/SiteStatusBadge'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { Skeleton } from 'src/components/ui/skeleton'
import { Spinner } from 'src/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip'
import { businessStatusLabel } from 'src/constants/labels'
import { formatNumber } from 'src/lib/format'
import { PAGE_SIZE_OPTIONS, pageItems } from 'src/lib/leadQuery'
import { whatsappUrl } from 'src/lib/phone'
import type { Lead, LeadStatus } from 'src/types'

const SKELETON_ROWS = 8

const stopRowClick = (event: MouseEvent) => event.stopPropagation()

interface LeadsTableProps {
	leads: Lead[]
	total: number
	page: number
	pageSize: number
	/** Primeira carga, sem dados. */
	loading: boolean
	/** Recarga com os dados anteriores na tela. */
	refreshing: boolean
	onPageChange: (page: number) => void
	onPageSizeChange: (pageSize: number) => void
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

function LeadsTable({
	leads,
	total,
	page,
	pageSize,
	loading,
	refreshing,
	onPageChange,
	onPageSizeChange,
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
		<Card id='leads-table' className='scroll-mt-40 gap-0 py-0 sm:scroll-mt-24'>
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
										<Skeleton className='ml-auto h-7 w-28' />
									</TableCell>
								</TableRow>
							))
						: leads.map((lead) => {
								const whatsapp = whatsappUrl(lead.internationalPhone)
								const instagram = lead.siteStatus === 'INSTAGRAM_ONLY' ? lead.websiteUri : null
								const photos = lead.photosUri ?? lead.googleMapsUri
								const closed = lead.businessStatus && lead.businessStatus !== 'OPERATIONAL'
								return (
									<TableRow key={lead.id} onClick={() => onOpen(lead)}>
										<TableCell className='max-w-72 pl-4'>
											<button
												onClick={(event) => {
													event.stopPropagation()
													onOpen(lead)
												}}
												className='block max-w-full truncate text-left font-medium hover:underline'
											>
												{lead.name}
											</button>
											<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
												<span className='truncate'>{lead.primaryTypeName ?? lead.category}</span>
												{closed && (
													<Badge variant='outline' className='h-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-1.5 text-[0.65rem] text-red-700 dark:text-red-300'>
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
											<LeadRating lead={lead} />
										</TableCell>
										<TableCell>
											<SiteStatusBadge status={lead.siteStatus} />
										</TableCell>
										<TableCell className='tabular-nums'>
											{lead.nationalPhone ?? <span className='text-muted-foreground'>—</span>}
										</TableCell>
										<TableCell onClick={stopRowClick}>
											<LeadStatusSelect
												value={lead.status}
												onChange={(status) => onStatusChange(lead, status)}
												size='sm'
												className='w-36'
											/>
										</TableCell>
										<TableCell className='pr-4' onClick={stopRowClick}>
											<div className='flex justify-end gap-0.5'>
												{whatsapp && (
													<IconLink href={whatsapp} label='Conversar no WhatsApp'>
														<MessageCircle className='text-green-600 dark:text-green-400' />
													</IconLink>
												)}
												{instagram && (
													<IconLink href={instagram} label='Abrir o Instagram'>
														<InstagramIcon className='text-pink-600 dark:text-pink-400' />
													</IconLink>
												)}
												{photos && (
													<IconLink href={photos} label='Ver fotos no Google'>
														<Images />
													</IconLink>
												)}
											</div>
										</TableCell>
									</TableRow>
								)
							})}
				</TableBody>
			</Table>

			<div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t px-4 py-3 text-sm'>
				<span className='flex items-center gap-2 text-muted-foreground'>
					{refreshing && <Spinner className='size-3.5' />}
					{loading ? 'Carregando…' : `Mostrando ${formatNumber(first)}–${formatNumber(last)} de ${formatNumber(total)}`}
				</span>

				<div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
					<div className='flex items-center gap-2'>
						<span className='text-muted-foreground'>Linhas por página</span>
						<Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
							<SelectTrigger size='sm' className='w-18' aria-label='Linhas por página'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PAGE_SIZE_OPTIONS.map((size) => (
									<SelectItem key={size} value={String(size)}>
										{size}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<nav aria-label='Paginação' className='flex items-center gap-1'>
						<Button
							variant='ghost'
							size='icon-sm'
							onClick={() => onPageChange(page - 1)}
							disabled={page <= 1 || loading}
							aria-label='Página anterior'
						>
							<ChevronLeft />
						</Button>
						<span className='px-2 text-muted-foreground tabular-nums sm:hidden'>
							{page} de {pages}
						</span>
						<div className='hidden items-center gap-1 sm:flex'>
							{pageItems(page, pages).map((item, index) =>
								item === null ? (
									<span key={`gap-${index}`} className='flex size-7 items-center justify-center text-muted-foreground'>
										<Ellipsis className='size-4' />
									</span>
								) : (
									<Button
										key={item}
										variant={item === page ? 'outline' : 'ghost'}
										size='icon-sm'
										className='tabular-nums'
										onClick={() => onPageChange(item)}
										disabled={loading}
										aria-label={`Página ${item}`}
										aria-current={item === page ? 'page' : undefined}
									>
										{item}
									</Button>
								),
							)}
						</div>
						<Button
							variant='ghost'
							size='icon-sm'
							onClick={() => onPageChange(page + 1)}
							disabled={page >= pages || loading}
							aria-label='Próxima página'
						>
							<ChevronRight />
						</Button>
					</nav>
				</div>
			</div>
		</Card>
	)
}

export default memo(LeadsTable)
