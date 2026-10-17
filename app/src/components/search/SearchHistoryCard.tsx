import { CircleAlert, History } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Badge } from 'src/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Skeleton } from 'src/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip'
import { SEARCH_STATUS_OPTIONS } from 'src/constants/labels'
import { formatDateTime, formatNumber } from 'src/lib/format'
import type { Search } from 'src/types'

interface SearchHistoryCardProps {
	searches: Search[]
	loading: boolean
	error: string | null
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

export default function SearchHistoryCard({ searches, loading, error }: SearchHistoryCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Histórico</CardTitle>
				<CardDescription>Buscas mais recentes primeiro.</CardDescription>
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
								</TableRow>
							</TableHeader>
							<TableBody>
								{searches.map((search) => (
									<TableRow key={search.id}>
										<TableCell className='text-muted-foreground tabular-nums'>{formatDateTime(search.createdAt)}</TableCell>
										<TableCell className='max-w-80 truncate font-medium'>{search.textQuery}</TableCell>
										<TableCell>
											<StatusBadge search={search} />
										</TableCell>
										<TableCell className='text-right tabular-nums'>{search.pagesFetched}</TableCell>
										<TableCell className='text-right tabular-nums'>{formatNumber(search.newLeadsCount)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
