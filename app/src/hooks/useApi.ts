import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from 'src/services'

interface ApiState<T> {
	data: T | null
	error: string | null
	loading: boolean
}

/** Carrega `fetcher` ao montar e quando ele muda, ignorando respostas antigas. `fetcher` precisa ser estável. */
export function useApi<T>(fetcher: () => Promise<T>) {
	const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true })
	const [version, setVersion] = useState(0)

	useEffect(() => {
		let ignore = false
		setState((current) => ({ ...current, loading: true }))
		fetcher()
			.then((data) => !ignore && setState({ data, error: null, loading: false }))
			.catch((error) => !ignore && setState((current) => ({ ...current, error: getErrorMessage(error), loading: false })))
		return () => {
			ignore = true
		}
	}, [fetcher, version])

	const reload = useCallback(() => setVersion((current) => current + 1), [])

	const setData = useCallback(
		(update: (current: T | null) => T | null) => setState((current) => ({ ...current, data: update(current.data) })),
		[],
	)

	return { ...state, reload, setData }
}
