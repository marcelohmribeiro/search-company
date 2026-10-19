import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import UsersTable from 'src/components/admin/UsersTable'
import PageHeader from 'src/components/PageHeader'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Card } from 'src/components/ui/card'
import { Skeleton } from 'src/components/ui/skeleton'
import { fetchAdminUsers, getErrorMessage } from 'src/services'
import type { AdminUser } from 'src/types'

export default function AdminUsers() {
	const [users, setUsers] = useState<AdminUser[] | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchAdminUsers()
			.then(setUsers)
			.catch((loadError) => setError(getErrorMessage(loadError)))
	}, [])

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Usuários'
				description='Quem usa o app, as empresas de cada um e quando entrou. Usuários novos são criados pelo terminal.'
			/>

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
