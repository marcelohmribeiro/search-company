import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { CircleAlert, MapPinned } from 'lucide-react'
import { Alert, AlertDescription } from 'src/components/ui/alert'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Field, FieldGroup, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { Spinner } from 'src/components/ui/spinner'
import { safeNext, withNext } from 'src/lib/safeNext'
import { isTokenActive } from 'src/lib/token'
import { getErrorMessage, login } from 'src/services'
import { useAuthStore } from 'src/store/authStore'

export default function Login() {
	const token = useAuthStore((state) => state.token)
	const signIn = useAuthStore((state) => state.signIn)
	const [searchParams] = useSearchParams()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (isTokenActive(token)) return <Navigate to={safeNext(searchParams.get('next'))} replace />

	async function handleSubmit(event: FormEvent) {
		event.preventDefault()
		setSubmitting(true)
		setError(null)
		try {
			const result = await login(email, password)
			signIn(result.token, result.user)
		} catch (loginError) {
			setError(getErrorMessage(loginError))
			setSubmitting(false)
		}
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-muted/40 px-4'>
			<Card className='w-full max-w-sm'>
				<CardHeader className='justify-items-center text-center'>
					<div className='mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
						<MapPinned className='size-5' />
					</div>
					<CardTitle className='text-lg'>Search Company</CardTitle>
					<CardDescription>Entre com o seu e-mail e senha.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor='email'>E-mail</FieldLabel>
								<Input
									id='email'
									placeholder='voce@exemplo.com'
									type='email'
									autoComplete='username'
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									required
									autoFocus
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor='password'>Senha</FieldLabel>
								<Input
									id='password'
									placeholder='Sua senha'
									type='password'
									autoComplete='current-password'
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									required
								/>
							</Field>
							{error && (
								<Alert variant='destructive'>
									<CircleAlert />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
							<Button type='submit' size='lg' disabled={submitting}>
								{submitting && <Spinner />}
								Entrar
							</Button>
							<p className='text-center text-sm text-muted-foreground'>
								Não tem conta?{' '}
								<Link
									to={withNext('/register', searchParams.get('next'))}
									className='font-medium text-foreground underline-offset-4 hover:underline'
								>
									Criar conta
								</Link>
							</p>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
