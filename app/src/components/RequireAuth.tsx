import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from 'src/store/authStore'

/** Libera as rotas filhas só com sessão; sem ela, manda para o login guardando a página atual. */
export default function RequireAuth() {
	const token = useAuthStore((state) => state.token)
	const location = useLocation()

	if (!token) {
		const next = location.pathname + location.search
		return <Navigate to={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`} replace />
	}
	return <Outlet />
}
