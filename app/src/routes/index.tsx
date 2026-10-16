import { createBrowserRouter } from 'react-router'

import Index from 'src/pages'
import Layout from 'src/pages/layout'
import Leads from 'src/pages/leads'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout />,
		children: [
			{ index: true, element: <Index /> },
			{ path: 'leads', element: <Leads /> },
		],
	},
])
