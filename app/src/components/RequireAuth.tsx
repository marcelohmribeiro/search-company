import { Navigate, Outlet, useLocation } from 'react-router'
import { isTokenActive } from 'src/lib/token'
import { useAuthStore } from 'src/store/authStore'

/** Libera as rotas filhas só com sessão válida; sem ela, manda para o login. */
export default function RequireAuth() {
	const token = useAuthStore((state) => state.token)
	const location = useLocation()

	if (!isTokenActive(token)) {
		const next = location.pathname + location.search
		return <Navigate to={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`} replace />
	}
	return <Outlet />
}
