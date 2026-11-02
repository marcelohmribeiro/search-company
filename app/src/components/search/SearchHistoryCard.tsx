import { useState } from 'react'
import { CircleAlert, History, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import SearchLeadsDialog from 'src/components/search/SearchLeadsDialog'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Skeleton } from 'src/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip'
import { SEARCH_STATUS_OPTIONS } from 'src/constants/labels'
import { formatDateTime, formatNumber } from 'src/lib/format'
import { deleteSearch, getErrorMessage } from 'src/services'
import type { Search } from 'src/types'

interface SearchHistoryCardProps {
	searches: Search[]
	loading: boolean
	error: string | null
	onDeleted: () => void
}

function StatusBadge({ search }: { search: Search }) {
	const option = SEARCH_STATUS_OPTIONS[search.status]
	const badge = (
		<Badge variant='outline' className={option.className}>
			{option.label}
		</Badge>
	)
	if (!search.error) return badge
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span tabIndex={0}>{badge}</span>
			</TooltipTrigger>
			<TooltipContent className='max-w-72'>{search.error}</TooltipContent>
		</Tooltip>
	)
}

export default function SearchHistoryCard({ searches, loading, error, onDeleted }: SearchHistoryCardProps) {
	const [opened, setOpened] = useState<Search | null>(null)
	const [deleting, setDeleting] = useState<Search | null>(null)

	async function confirmDelete() {
		if (!deleting) return
		try {
			await deleteSearch(deleting.id)
			toast.success('Busca apagada')
			onDeleted()
		} catch (deleteError) {
			toast.error('Não foi possível apagar a busca', { description: getErrorMessage(deleteError) })
		} finally {
			setDeleting(null)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Histórico</CardTitle>
				<CardDescription>Buscas mais recentes primeiro. Clique numa busca para ver as empresas que ela trouxe.</CardDescription>
			</CardHeader>

			<CardContent>
				{error ? (
					<Alert variant='destructive'>
						<CircleAlert />
						<AlertTitle>Não foi possível carregar o histórico</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : loading ? (
					<div className='space-y-2'>
						{Array.from({ length: 4 }, (_, index) => (
							<Skeleton key={index} className='h-9 w-full' />
						))}
					</div>
				) : searches.length === 0 ? (
					<Empty className='border border-dashed'>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<History />
							</EmptyMedia>
							<EmptyTitle>Nenhuma busca ainda</EmptyTitle>
							<EmptyDescription>As buscas que você fizer aparecem aqui.</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<div className='overflow-hidden rounded-lg border'>
						<Table>
							<TableHeader className='bg-muted/50'>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Busca</TableHead>
									<TableHead>Situação</TableHead>
									<TableHead className='text-right'>Páginas</TableHead>
									<TableHead className='text-right'>Novos</TableHead>
									<TableHead className='w-10' />
								</TableRow>
							</TableHeader>
							<TableBody>
								{searches.map((search) => (
									<TableRow key={search.id} onClick={() => setOpened(search)}>
										<TableCell className='text-muted-foreground tabular-nums'>{formatDateTime(search.createdAt)}</TableCell>
										<TableCell className='max-w-80 truncate font-medium'>{search.textQuery}</TableCell>
										<TableCell>
											<StatusBadge search={search} />
										</TableCell>
										<TableCell className='text-right tabular-nums'>{search.pagesFetched}</TableCell>
										<TableCell className='text-right tabular-nums'>{formatNumber(search.newLeadsCount)}</TableCell>
										<TableCell className='py-0' onClick={(event) => event.stopPropagation()}>
											{search.deletable && (
												<Tooltip>
													<TooltipTrigger asChild>
														<Button variant='ghost' size='icon-sm' aria-label='Apagar busca' onClick={() => setDeleting(search)}>
															<Trash2 />
														</Button>
													</TooltipTrigger>
													<TooltipContent>Apagar busca</TooltipContent>
												</Tooltip>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>

			<SearchLeadsDialog search={opened} onClose={() => setOpened(null)} />

			<AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
				<AlertDialogContent className='data-[size=default]:sm:max-w-md'>
					<AlertDialogHeader>
						<AlertDialogTitle>Apagar busca</AlertDialogTitle>
						<AlertDialogDescription>
							“{deleting?.textQuery}” sai do histórico. As empresas que entraram na sua lista por ela e não aparecem em
							outra busca sua também saem. As requisições gastas continuam contando no mês.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction variant='destructive' onClick={confirmDelete}>
							Apagar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}
