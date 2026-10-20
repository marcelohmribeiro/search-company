import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CircleAlert } from 'lucide-react'
import UserAccessesCard from 'src/components/admin/UserAccessesCard'
import UserLeadsTable from 'src/components/admin/UserLeadsTable'
import PageHeader from 'src/components/PageHeader'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Skeleton } from 'src/components/ui/skeleton'
import { ROLE_LABELS } from 'src/constants/labels'
import { formatDate, formatDateTime, formatNumber } from 'src/lib/format'
import { useApi } from 'src/hooks'
import { fetchAdminUser, fetchAdminUserAccesses, fetchAdminUserLeads } from 'src/services'

const PAGE_SIZE = 25

function Stat({ label, value, hint }: { label: string; value: string | null; hint?: string }) {
	return (
		<Card className='gap-1 py-4'>
			<CardContent className='space-y-0.5 px-4'>
				<p className='text-xs text-muted-foreground'>{label}</p>
				{value === null ? (
					<Skeleton className='h-8 w-16' />
				) : (
					<p className='font-heading text-2xl font-semibold tabular-nums'>{value}</p>
				)}
				{hint && <p className='truncate text-xs text-muted-foreground'>{hint}</p>}
			</CardContent>
		</Card>
	)
}

function AdminUserView({ userId }: { userId: number }) {
	const [page, setPage] = useState(1)
	const summary = useApi(useCallback(() => fetchAdminUser(userId), [userId]))
	const accessList = useApi(useCallback(() => fetchAdminUserAccesses(userId), [userId]))
	const leadPage = useApi(useCallback(() => fetchAdminUserLeads(userId, page, PAGE_SIZE), [userId, page]))
	const user = summary.data
	const leads = leadPage.data
	const error = summary.error ?? accessList.error ?? leadPage.error

	const back = (
		<Button variant='outline' asChild>
			<Link to='/admin'>
				<ArrowLeft />
				Usuários
			</Link>
		</Button>
	)

	if (error) {
		return (
			<div className='space-y-6'>
				<PageHeader title='Usuário' actions={back} />
				<Alert variant='destructive'>
					<CircleAlert />
					<AlertTitle>Não foi possível carregar o usuário</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title={user?.username ?? 'Usuário'}
				description={user && `${ROLE_LABELS[user.role]} · no app desde ${formatDate(user.createdAt)}`}
				actions={back}
			/>

			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				<Stat label='Empresas' value={user && formatNumber(user.leadsCount)} />
				<Stat label='Buscas' value={user && formatNumber(user.searchesCount)} />
				<Stat
					label='Requisições no mês'
					value={user && `${formatNumber(user.usage.used)} / ${formatNumber(user.usage.limit)}`}
					hint={user ? `Restam ${formatNumber(user.usage.remaining)}` : undefined}
				/>
				<Stat
					label='Entradas no app'
					value={user && formatNumber(user.accessesCount)}
					hint={user?.lastAccessAt ? `Última: ${formatDateTime(user.lastAccessAt)}` : undefined}
				/>
			</div>

			<div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]'>
				<Card className='min-w-0 gap-0 overflow-hidden pb-0'>
					<CardHeader className='pb-4'>
						<CardTitle>Empresas</CardTitle>
						<CardDescription>As que entraram na lista mais recentemente primeiro.</CardDescription>
					</CardHeader>
					<div className='border-t'>
						<UserLeadsTable data={leads} refreshing={leads !== null && leads.page !== page} onPageChange={setPage} />
					</div>
				</Card>
				<UserAccessesCard accesses={accessList.data} />
			</div>
		</div>
	)
}

export default function AdminUser() {
	const { id } = useParams()
	return <AdminUserView key={id} userId={Number(id)} />
}
