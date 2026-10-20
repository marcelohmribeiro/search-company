import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CircleAlert, KeyRound, Plus } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from 'src/components/PageHeader'
import CreatedTokenCard from 'src/components/tokens/CreatedTokenCard'
import TokensTable from 'src/components/tokens/TokensTable'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Field, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { Skeleton } from 'src/components/ui/skeleton'
import { Spinner } from 'src/components/ui/spinner'
import { createApiToken, fetchApiTokens, getErrorMessage, revokeApiToken } from 'src/services'
import type { ApiToken, CreatedApiToken } from 'src/types'

export default function Tokens() {
	const [tokens, setTokens] = useState<ApiToken[] | null>(null)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [name, setName] = useState('')
	const [creating, setCreating] = useState(false)
	const [created, setCreated] = useState<CreatedApiToken | null>(null)
	const [revokingId, setRevokingId] = useState<number | null>(null)

	useEffect(() => {
		fetchApiTokens()
			.then(setTokens)
			.catch((error) => setLoadError(getErrorMessage(error)))
	}, [])

	async function handleCreate(event: FormEvent) {
		event.preventDefault()
		setCreating(true)
		try {
			const result = await createApiToken(name.trim())
			const { token: _value, ...summary } = result
			setCreated(result)
			setTokens((current) => [summary, ...(current ?? [])])
			setName('')
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
			setTokens((current) => current?.filter((item) => item.id !== token.id) ?? null)
			if (created?.id === token.id) setCreated(null)
			toast.success(`Token "${token.name}" revogado`)
		} catch (error) {
			toast.error('Não foi possível revogar o token', { description: getErrorMessage(error) })
		} finally {
			setRevokingId(null)
		}
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Tokens de acesso'
				description='Deixe o Claude ler os seus leads e atualizar status e anotações sem usar a sua senha. Um token não faz buscas nem gasta requisições.'
			/>

			{created && <CreatedTokenCard created={created} onDone={() => setCreated(null)} />}

			<Card>
				<CardHeader>
					<CardTitle>Novo token</CardTitle>
					<CardDescription>Use um nome que lembre onde ele vai ficar, como o computador em que você usa o Claude.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleCreate} className='flex flex-col gap-2 sm:flex-row sm:items-end'>
						<Field className='flex-1'>
							<FieldLabel htmlFor='token-name'>Nome</FieldLabel>
							<Input
								id='token-name'
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder='Claude no MacBook'
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
								<EmptyDescription>Crie um para o Claude conseguir buscar os seus leads.</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
				</Card>
			)}
		</div>
	)
}
