import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from 'src/store/authStore'

/** Libera as rotas filhas só para administradores. */
export default function RequireAdmin() {
	const role = useAuthStore((state) => state.user?.role)
	if (role !== 'ADMIN') return <Navigate to='/' replace />
	return <Outlet />
}
