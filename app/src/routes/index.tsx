import { createBrowserRouter } from 'react-router'

import RequireAuth from 'src/components/RequireAuth'
import Index from 'src/pages'
import Layout from 'src/pages/layout'
import Leads from 'src/pages/leads'
import Login from 'src/pages/login'

export const router = createBrowserRouter([
	{ path: '/login', element: <Login /> },
	{
		element: <RequireAuth />,
		children: [
			{
				path: '/',
				element: <Layout />,
				children: [
					{ index: true, element: <Index /> },
					{ path: 'leads', element: <Leads /> },
				],
			},
		],
	},
])
