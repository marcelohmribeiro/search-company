import { useCallback, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import LeadDetailSheet from 'src/components/leads/LeadDetailSheet'
import LeadRating from 'src/components/leads/LeadRating'
import LeadStatusLabel from 'src/components/leads/LeadStatusLabel'
import SiteStatusBadge from 'src/components/leads/SiteStatusBadge'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Badge } from 'src/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'src/components/ui/dialog'
import { Skeleton } from 'src/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { useApi } from 'src/hooks'
import { formatDateTime, plural } from 'src/lib/format'
import { fetchSearchLeads } from 'src/services'
import type { Lead, Search } from 'src/types'

interface SearchLeadsDialogProps {
	search: Search | null
	onClose: () => void
}

function SearchLeadsList({ searchId }: { searchId: number }) {
	const { data, error, setData } = useApi(useCallback(() => fetchSearchLeads(searchId), [searchId]))
	const [selected, setSelected] = useState<Lead | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)
	const items = data?.items

	function openLead(lead: Lead) {
		setSelected(lead)
		setDetailOpen(true)
	}

	function replaceLead(lead: Lead) {
		setData((current) => current && { ...current, items: current.items.map((item) => (item.id === lead.id ? { ...item, ...lead } : item)) })
	}

	if (error) {
		return (
			<div className='p-4'>
				<Alert variant='destructive'>
					<CircleAlert />
					<AlertTitle>Não foi possível carregar as empresas</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		)
	}

	if (!items) {
		return (
			<div className='space-y-2 p-4'>
				{Array.from({ length: 5 }, (_, index) => (
					<Skeleton key={index} className='h-9 w-full' />
				))}
			</div>
		)
	}

	if (!items.length) {
		return <p className='p-6 text-center text-sm text-muted-foreground'>Essa busca não trouxe nenhuma empresa.</p>
	}

	return (
		<>
			<div className='flex-1 overflow-y-auto'>
				<Table>
					<TableHeader className='sticky top-0 bg-muted'>
						<TableRow>
							<TableHead className='pl-4'>Empresa</TableHead>
							<TableHead>Avaliação</TableHead>
							<TableHead>Site</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className='pr-4 text-right'>Página</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((lead) => (
							<TableRow key={lead.id} onClick={() => openLead(lead)}>
								<TableCell className='max-w-64 pl-4'>
									<div className='flex items-center gap-1.5'>
										<span className='truncate font-medium'>{lead.name}</span>
										{lead.isNew && (
											<Badge variant='outline' className='h-4 px-1.5 text-[0.65rem]'>
												Nova
											</Badge>
										)}
									</div>
									<div className='truncate text-xs text-muted-foreground'>
										{lead.primaryTypeName ?? lead.category}
										{lead.neighborhood && ` · ${lead.neighborhood}`}
									</div>
								</TableCell>
								<TableCell>
									<LeadRating lead={lead} />
								</TableCell>
								<TableCell>
									<SiteStatusBadge status={lead.siteStatus} />
								</TableCell>
								<TableCell>
									<LeadStatusLabel status={lead.status} />
								</TableCell>
								<TableCell className='pr-4 text-right text-muted-foreground tabular-nums'>{lead.page}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className='border-t px-4 py-3 text-sm text-muted-foreground'>{plural(items.length, 'empresa', 'empresas')} nessa busca</div>

			<LeadDetailSheet lead={selected} open={detailOpen} onOpenChange={setDetailOpen} onSaved={replaceLead} />
		</>
	)
}

export default function SearchLeadsDialog({ search, onClose }: SearchLeadsDialogProps) {
	const [shown, setShown] = useState(search)
	if (search && search !== shown) setShown(search)

	return (
		<Dialog open={search !== null} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'>
				<DialogHeader className='border-b p-4 pr-12'>
					<DialogTitle className='text-lg'>{shown?.textQuery}</DialogTitle>
					<DialogDescription>
						{shown &&
							`${formatDateTime(shown.createdAt)} · ${plural(shown.pagesFetched, 'página', 'páginas')} · ${plural(shown.newLeadsCount, 'empresa nova', 'empresas novas')}`}
					</DialogDescription>
				</DialogHeader>
				{shown && <SearchLeadsList key={shown.id} searchId={shown.id} />}
			</DialogContent>
		</Dialog>
	)
}
