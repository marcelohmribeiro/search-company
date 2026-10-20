import { useState } from 'react'
import AuthCard from 'src/components/AuthCard'
import { Field, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { useAuthSubmit } from 'src/hooks'
import { login } from 'src/services'

export default function Login() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const { submit, submitting, error } = useAuthSubmit()

	return (
		<AuthCard
			title='Search Company'
			description='Entre com o seu usuário e senha.'
			submitLabel='Entrar'
			submitting={submitting}
			error={error}
			onSubmit={() => submit(() => login(username, password))}
			switchText='Não tem conta?'
			switchLabel='Criar conta'
			switchTo='/register'
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
					placeholder='Sua senha'
					type='password'
					autoComplete='current-password'
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
				/>
			</Field>
		</AuthCard>
	)
}
