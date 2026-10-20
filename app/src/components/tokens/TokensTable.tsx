import { Trash2 } from 'lucide-react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from 'src/components/ui/alert-dialog'
import { Button } from 'src/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { formatDateTime } from 'src/lib/format'
import type { ApiToken } from 'src/types'

interface TokensTableProps {
	tokens: ApiToken[]
	revokingId: number | null
	onRevoke: (token: ApiToken) => void
}

export default function TokensTable({ tokens, revokingId, onRevoke }: TokensTableProps) {
	return (
		<Table>
			<TableHeader className='bg-muted/50'>
				<TableRow>
					<TableHead className='pl-4'>Nome</TableHead>
					<TableHead>Termina em</TableHead>
					<TableHead>Criado em</TableHead>
					<TableHead>Último uso</TableHead>
					<TableHead className='pr-4' />
				</TableRow>
			</TableHeader>
			<TableBody>
				{tokens.map((token) => (
					<TableRow key={token.id}>
						<TableCell className='pl-4 font-medium'>{token.name}</TableCell>
						<TableCell className='font-mono text-muted-foreground'>…{token.lastChars}</TableCell>
						<TableCell className='text-muted-foreground tabular-nums'>{formatDateTime(token.createdAt)}</TableCell>
						<TableCell className='text-muted-foreground tabular-nums'>
							{token.lastUsedAt ? formatDateTime(token.lastUsedAt) : 'Nunca'}
						</TableCell>
						<TableCell className='pr-4 text-right'>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant='ghost'
										size='sm'
										className='text-destructive hover:text-destructive'
										disabled={revokingId === token.id}
									>
										<Trash2 />
										Revogar
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent className='data-[size=default]:sm:max-w-md'>
									<AlertDialogHeader>
										<AlertDialogTitle>Revogar "{token.name}"?</AlertDialogTitle>
										<AlertDialogDescription>
											O token para de funcionar na hora. Quem estiver usando ele, como o Claude, perde o acesso aos seus leads.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancelar</AlertDialogCancel>
										<AlertDialogAction variant='destructive' onClick={() => onRevoke(token)}>
											Revogar
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
