import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router'
import { buildLeadSearchParams, parseLeadQuery } from 'src/lib/leadQuery'
import type { LeadQuery } from 'src/lib/leadQuery'
import { useLeadsViewStore } from 'src/store/leadsViewStore'
import type { LeadFilters } from 'src/types'

type TypedFilters = Pick<LeadFilters, 'q' | 'minReviews'>

const TYPING_DELAY_MS = 300

/** Filtros e paginação da tela de leads, guardados na URL. O texto digitado vai para a URL após uma pausa. */
export function useLeadQuery() {
	const [searchParams, setSearchParams] = useSearchParams()
	const location = useLocation()
	const navigationType = useNavigationType()
	const setLastSearch = useLeadsViewStore((state) => state.setSearch)

	const search = searchParams.toString()
	const query = useMemo(() => parseLeadQuery(new URLSearchParams(search)), [search])
	const [typed, setTyped] = useState<TypedFilters>({ q: query.filters.q, minReviews: query.filters.minReviews })
	const pending = useRef<Partial<TypedFilters>>({})
	const timer = useRef<number | undefined>(undefined)

	useEffect(() => {
		setLastSearch(location.search)
	}, [location.search, setLastSearch])

	useEffect(() => {
		if (navigationType === 'POP') setTyped({ q: query.filters.q, minReviews: query.filters.minReviews })
	}, [location.key, navigationType, query.filters.q, query.filters.minReviews])

	useEffect(() => () => window.clearTimeout(timer.current), [])

	const update = useCallback(
		(change: (current: LeadQuery) => LeadQuery, push = false) =>
			setSearchParams((current) => buildLeadSearchParams(change(parseLeadQuery(current))), { replace: !push }),
		[setSearchParams],
	)

	const applyFilters = useCallback(
		(changes: Partial<LeadFilters>) =>
			update((current) => ({ ...current, filters: { ...current.filters, ...changes }, page: 1 })),
		[update],
	)

	const setFilters = useCallback(
		({ q, minReviews, ...rest }: Partial<LeadFilters>) => {
			const typedChanges = { ...(q !== undefined && { q }), ...(minReviews !== undefined && { minReviews }) }
			if (Object.keys(typedChanges).length) {
				setTyped((current) => ({ ...current, ...typedChanges }))
				pending.current = { ...pending.current, ...typedChanges }
				window.clearTimeout(timer.current)
				timer.current = window.setTimeout(() => {
					applyFilters(pending.current)
					pending.current = {}
				}, TYPING_DELAY_MS)
			}
			if (Object.keys(rest).length) applyFilters(rest)
		},
		[applyFilters],
	)

	const resetFilters = useCallback(() => {
		window.clearTimeout(timer.current)
		pending.current = {}
		setTyped({ q: '', minReviews: '' })
		setSearchParams(new URLSearchParams(), { replace: true })
	}, [setSearchParams])

	const setPage = useCallback(
		(page: number, push = true) => update((current) => ({ ...current, page }), push),
		[update],
	)

	const setPageSize = useCallback(
		(pageSize: number) => update((current) => ({ ...current, pageSize, page: 1 })),
		[update],
	)

	const filters = useMemo(() => ({ ...query.filters, ...typed }), [query.filters, typed])

	return { query, filters, setFilters, resetFilters, setPage, setPageSize }
}
