import { useState } from 'react'
import { getErrorMessage } from 'src/services'
import { useAuthStore } from 'src/store/authStore'
import type { LoginResult } from 'src/types'

/** Envia o login ou o cadastro e abre a sessão. Com `validationError`, só mostra o erro. */
export function useAuthSubmit() {
	const signIn = useAuthStore((state) => state.signIn)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function submit(request: () => Promise<LoginResult>, validationError?: string) {
		if (validationError) {
			setError(validationError)
			return
		}
		setSubmitting(true)
		setError(null)
		try {
			const result = await request()
			signIn(result.token, result.user)
		} catch (requestError) {
			setError(getErrorMessage(requestError))
			setSubmitting(false)
		}
	}

	return { submit, submitting, error }
}
