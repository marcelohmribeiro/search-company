import { Link } from 'react-router'
import { Badge } from 'src/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { ROLE_LABELS } from 'src/constants/labels'
import { formatDateTime, formatNumber } from 'src/lib/format'
import type { AdminUser } from 'src/types'

export default function UsersTable({ users }: { users: AdminUser[] }) {
	return (
		<Table>
			<TableHeader className='bg-muted/50'>
				<TableRow>
					<TableHead className='pl-4'>Usuário</TableHead>
					<TableHead className='text-right'>Empresas</TableHead>
					<TableHead className='text-right'>Buscas</TableHead>
					<TableHead className='text-right'>Requisições no mês</TableHead>
					<TableHead className='text-right'>Entradas</TableHead>
					<TableHead className='pr-4'>Último acesso</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{users.map((user) => (
					<TableRow key={user.id}>
						<TableCell className='pl-4'>
							<div className='flex items-center gap-2'>
								<Link to={`/admin/users/${user.id}`} className='font-medium hover:underline'>
									{user.username}
								</Link>
								{user.role === 'ADMIN' && <Badge variant='secondary'>{ROLE_LABELS.ADMIN}</Badge>}
							</div>
						</TableCell>
						<TableCell className='text-right tabular-nums'>{formatNumber(user.leadsCount)}</TableCell>
						<TableCell className='text-right tabular-nums'>{formatNumber(user.searchesCount)}</TableCell>
						<TableCell className='text-right tabular-nums'>
							{formatNumber(user.usage.used)}
							<span className='text-muted-foreground'> / {formatNumber(user.usage.limit)}</span>
						</TableCell>
						<TableCell className='text-right tabular-nums'>{formatNumber(user.accessesCount)}</TableCell>
						<TableCell className='pr-4 text-muted-foreground tabular-nums'>
							{user.lastAccessAt ? formatDateTime(user.lastAccessAt) : '—'}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
