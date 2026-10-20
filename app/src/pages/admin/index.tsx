import { CircleAlert } from 'lucide-react'
import UsersTable from 'src/components/admin/UsersTable'
import PageHeader from 'src/components/PageHeader'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Card } from 'src/components/ui/card'
import { Skeleton } from 'src/components/ui/skeleton'
import { useApi } from 'src/hooks'
import { fetchAdminUsers } from 'src/services'

export default function AdminUsers() {
	const { data: users, error } = useApi(fetchAdminUsers)

	return (
		<div className='space-y-6'>
			<PageHeader title='Usuários' />

			{error ? (
				<Alert variant='destructive'>
					<CircleAlert />
					<AlertTitle>Não foi possível carregar os usuários</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : (
				<Card className='gap-0 overflow-hidden py-0'>
					{users ? (
						<UsersTable users={users} />
					) : (
						<div className='space-y-2 p-4'>
							{Array.from({ length: 3 }, (_, index) => (
								<Skeleton key={index} className='h-9 w-full' />
							))}
						</div>
					)}
				</Card>
			)}
		</div>
	)
}
