import { useState } from 'react'
import AuthCard from 'src/components/AuthCard'
import { Field, FieldDescription, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { useAuthSubmit } from 'src/hooks'
import { register } from 'src/services'

const MIN_PASSWORD_LENGTH = 8

function validate(password: string, confirmation: string) {
	if (password.length < MIN_PASSWORD_LENGTH) return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
	if (password !== confirmation) return 'As senhas não conferem.'
	return undefined
}

export default function Register() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [confirmation, setConfirmation] = useState('')
	const { submit, submitting, error } = useAuthSubmit()

	return (
		<AuthCard
			title='Criar conta'
			submitLabel='Criar conta'
			submitting={submitting}
			error={error}
			onSubmit={() => submit(() => register(username, password), validate(password, confirmation))}
			switchText='Já tem conta?'
			switchLabel='Entrar'
			switchTo='/login'
		>
			<Field>
				<FieldLabel htmlFor='username'>Usuário</FieldLabel>
				<Input
					id='username'
					placeholder='seu.usuario'
					autoComplete='username'
					autoCapitalize='none'
					spellCheck={false}
					value={username}
					onChange={(event) => setUsername(event.target.value)}
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
		</AuthCard>
	)
}
