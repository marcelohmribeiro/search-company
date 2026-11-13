import { createBrowserRouter } from 'react-router'

import RequireAdmin from 'src/components/RequireAdmin'
import RequireAuth from 'src/components/RequireAuth'
import Index from 'src/pages'
import AdminUsers from 'src/pages/admin'
import AdminUser from 'src/pages/admin/user'
import Layout from 'src/pages/layout'
import Leads from 'src/pages/leads'
import Login from 'src/pages/login'
import Register from 'src/pages/register'
import Projects from 'src/pages/projects'
import Tokens from 'src/pages/tokens'

const RELOAD_KEY = 'search-company:chunk-reload'

/** Loads a route chunk; if it vanished after a new deploy, reloads the page once to get the fresh build. */
const loadRoute = (load: () => Promise<{ default: React.ComponentType }>) => () =>
	load().then(
		({ default: Component }) => {
			sessionStorage.removeItem(RELOAD_KEY)
			return { Component }
		},
		(error) => {
			if (!sessionStorage.getItem(RELOAD_KEY)) {
				sessionStorage.setItem(RELOAD_KEY, '1')
				window.location.reload()
				return new Promise<never>(() => {})
			}
			throw error
		},
	)

export const router = createBrowserRouter([
	{ path: '/login', element: <Login /> },
	{ path: '/register', element: <Register /> },
	{
		element: <RequireAuth />,
		children: [
			{
				path: '/',
				element: <Layout />,
				children: [
					{ index: true, element: <Index /> },
					{ path: 'leads', element: <Leads /> },
					{ path: 'leads/:id/venda', lazy: loadRoute(() => import('src/pages/leads/pitch')) },
					{ path: 'projetos', element: <Projects /> },
					{ path: 'tokens', element: <Tokens /> },
					{
						path: 'admin',
						element: <RequireAdmin />,
						children: [
							{ index: true, element: <AdminUsers /> },
							{ path: 'users/:id', element: <AdminUser /> },
						],
					},
				],
			},
		],
	},
])
