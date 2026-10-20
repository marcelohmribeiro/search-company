import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { CircleAlert, MapPinned } from 'lucide-react'
import { Alert, AlertDescription } from 'src/components/ui/alert'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { FieldGroup } from 'src/components/ui/field'
import { Spinner } from 'src/components/ui/spinner'
import { safeNext, withNext } from 'src/lib/safeNext'
import { isTokenActive } from 'src/lib/token'
import { useAuthStore } from 'src/store/authStore'

interface AuthCardProps {
	title: string
	description?: string
	submitLabel: string
	submitting: boolean
	error: string | null
	onSubmit: () => void
	switchText: string
	switchLabel: string
	switchTo: string
	children: ReactNode
}

/** Redireciona para o `next` da URL quando já há sessão. */
export default function AuthCard({
	title,
	description,
	submitLabel,
	submitting,
	error,
	onSubmit,
	switchText,
	switchLabel,
	switchTo,
	children,
}: AuthCardProps) {
	const token = useAuthStore((state) => state.token)
	const [searchParams] = useSearchParams()
	const next = searchParams.get('next')

	if (isTokenActive(token)) return <Navigate to={safeNext(next)} replace />

	function handleSubmit(event: FormEvent) {
		event.preventDefault()
		onSubmit()
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-muted/40 px-4'>
			<Card className='w-full max-w-sm'>
				<CardHeader className='justify-items-center text-center'>
					<div className='mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
						<MapPinned className='size-5' />
					</div>
					<CardTitle className='text-lg'>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							{children}
							{error && (
								<Alert variant='destructive'>
									<CircleAlert />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
							<Button type='submit' size='lg' disabled={submitting}>
								{submitting && <Spinner />}
								{submitLabel}
							</Button>
							<p className='text-center text-sm text-muted-foreground'>
								{switchText}{' '}
								<Link
									to={withNext(switchTo, next)}
									className='font-medium text-foreground underline-offset-4 hover:underline'
								>
									{switchLabel}
								</Link>
							</p>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
