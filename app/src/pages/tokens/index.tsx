import { useState } from 'react'
import type { FormEvent } from 'react'
import { CircleAlert, KeyRound, Plus } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from 'src/components/PageHeader'
import CreatedTokenCard from 'src/components/tokens/CreatedTokenCard'
import TokensTable from 'src/components/tokens/TokensTable'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Field, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { Skeleton } from 'src/components/ui/skeleton'
import { Spinner } from 'src/components/ui/spinner'
import { useApi } from 'src/hooks'
import { createApiToken, fetchApiTokens, getErrorMessage, revokeApiToken } from 'src/services'
import type { ApiToken, CreatedApiToken } from 'src/types'

export default function Tokens() {
	const { data: tokens, error: loadError, reload } = useApi(fetchApiTokens)
	const [name, setName] = useState('')
	const [creating, setCreating] = useState(false)
	const [created, setCreated] = useState<CreatedApiToken | null>(null)
	const [revokingId, setRevokingId] = useState<number | null>(null)

	async function handleCreate(event: FormEvent) {
		event.preventDefault()
		setCreating(true)
		try {
			setCreated(await createApiToken(name.trim()))
			setName('')
			reload()
		} catch (error) {
			toast.error('Não foi possível criar o token', { description: getErrorMessage(error) })
		} finally {
			setCreating(false)
		}
	}

	async function handleRevoke(token: ApiToken) {
		setRevokingId(token.id)
		try {
			await revokeApiToken(token.id)
			if (created?.id === token.id) setCreated(null)
			reload()
			toast.success(`Token "${token.name}" revogado`)
		} catch (error) {
			toast.error('Não foi possível revogar o token', { description: getErrorMessage(error) })
		} finally {
			setRevokingId(null)
		}
	}

	return (
		<div className='space-y-6'>
			<PageHeader title='Tokens de acesso' />

			{created && <CreatedTokenCard created={created} onDone={() => setCreated(null)} />}

			<Card>
				<CardContent>
					<form onSubmit={handleCreate} className='flex flex-col gap-2 sm:flex-row sm:items-end'>
						<Field className='flex-1'>
							<FieldLabel htmlFor='token-name'>Nome</FieldLabel>
							<Input
								id='token-name'
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder='Claude'
								maxLength={50}
								disabled={creating}
							/>
						</Field>
						<Button type='submit' disabled={creating || !name.trim()}>
							{creating ? <Spinner /> : <Plus />}
							Criar token
						</Button>
					</form>
				</CardContent>
			</Card>

			{loadError ? (
				<Alert variant='destructive'>
					<CircleAlert />
					<AlertTitle>Não foi possível carregar os tokens</AlertTitle>
					<AlertDescription>{loadError}</AlertDescription>
				</Alert>
			) : (
				<Card className='gap-0 overflow-hidden py-0'>
					{!tokens ? (
						<div className='space-y-2 p-4'>
							{Array.from({ length: 2 }, (_, index) => (
								<Skeleton key={index} className='h-9 w-full' />
							))}
						</div>
					) : tokens.length ? (
						<TokensTable tokens={tokens} revokingId={revokingId} onRevoke={handleRevoke} />
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant='icon'>
									<KeyRound />
								</EmptyMedia>
								<EmptyTitle>Nenhum token</EmptyTitle>
							</EmptyHeader>
						</Empty>
					)}
				</Card>
			)}
		</div>
	)
}
