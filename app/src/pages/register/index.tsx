import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { CircleAlert, MapPinned } from 'lucide-react'
import { Alert, AlertDescription } from 'src/components/ui/alert'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { Spinner } from 'src/components/ui/spinner'
import { safeNext, withNext } from 'src/lib/safeNext'
import { isTokenActive } from 'src/lib/token'
import { getErrorMessage, register } from 'src/services'
import { useAuthStore } from 'src/store/authStore'

const MIN_PASSWORD_LENGTH = 8

export default function Register() {
	const token = useAuthStore((state) => state.token)
	const signIn = useAuthStore((state) => state.signIn)
	const [searchParams] = useSearchParams()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmation, setConfirmation] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (isTokenActive(token)) return <Navigate to={safeNext(searchParams.get('next'))} replace />

	async function handleSubmit(event: FormEvent) {
		event.preventDefault()
		if (password.length < MIN_PASSWORD_LENGTH) {
			setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
			return
		}
		if (password !== confirmation) {
			setError('As senhas não conferem.')
			return
		}

		setSubmitting(true)
		setError(null)
		try {
			const result = await register(email, password)
			signIn(result.token, result.user)
		} catch (registerError) {
			setError(getErrorMessage(registerError))
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
					<CardTitle className='text-lg'>Criar conta</CardTitle>
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
									placeholder='Mínimo de 8 caracteres'
									type='password'
									autoComplete='new-password'
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									required
								/>
								<FieldDescription>Pelo menos {MIN_PASSWORD_LENGTH} caracteres.</FieldDescription>
							</Field>
							<Field>
								<FieldLabel htmlFor='password-confirmation'>Confirme a senha</FieldLabel>
								<Input
									id='password-confirmation'
									placeholder='Digite a senha de novo'
									type='password'
									autoComplete='new-password'
									value={confirmation}
									onChange={(event) => setConfirmation(event.target.value)}
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
								Criar conta
							</Button>
							<p className='text-center text-sm text-muted-foreground'>
								Já tem conta?{' '}
								<Link
									to={withNext('/login', searchParams.get('next'))}
									className='font-medium text-foreground underline-offset-4 hover:underline'
								>
									Entrar
								</Link>
							</p>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
