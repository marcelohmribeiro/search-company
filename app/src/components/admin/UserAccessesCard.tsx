import { LogIn } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Skeleton } from 'src/components/ui/skeleton'
import { formatDate, formatDateTime, formatTime } from 'src/lib/format'
import type { UserAccess } from 'src/types'

/** Até quando a entrada durou: só a hora no mesmo dia, data e hora se passou da meia-noite. */
function accessEnd({ startedAt, lastSeenAt }: UserAccess) {
	if (formatTime(startedAt) === formatTime(lastSeenAt) && formatDate(startedAt) === formatDate(lastSeenAt)) return null
	return formatDate(startedAt) === formatDate(lastSeenAt) ? formatTime(lastSeenAt) : formatDateTime(lastSeenAt)
}

export default function UserAccessesCard({ accesses }: { accesses: UserAccess[] | null }) {
	return (
		<Card className='gap-4'>
			<CardHeader>
				<CardTitle>Entradas no app</CardTitle>
				<CardDescription>Mais recentes primeiro.</CardDescription>
			</CardHeader>
			<CardContent>
				{!accesses ? (
					<div className='space-y-2'>
						{Array.from({ length: 5 }, (_, index) => (
							<Skeleton key={index} className='h-6 w-full' />
						))}
					</div>
				) : accesses.length === 0 ? (
					<Empty className='border border-dashed'>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<LogIn />
							</EmptyMedia>
							<EmptyTitle>Ainda não entrou no app</EmptyTitle>
						</EmptyHeader>
					</Empty>
				) : (
					<ul className='max-h-[32rem] divide-y overflow-y-auto text-sm'>
						{accesses.map((access) => {
							const end = accessEnd(access)
							return (
								<li key={access.id} className='flex items-baseline justify-between gap-3 py-2 tabular-nums'>
									<span className='font-medium'>{formatDate(access.startedAt)}</span>
									<span className='text-muted-foreground'>
										{formatTime(access.startedAt)}
										{end && ` – ${end}`}
									</span>
								</li>
							)
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	)
}
