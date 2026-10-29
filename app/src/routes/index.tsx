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
import Tokens from 'src/pages/tokens'

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
					{ path: 'leads/:id/venda', lazy: () => import('src/pages/leads/pitch').then(({ default: Component }) => ({ Component })) },
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
