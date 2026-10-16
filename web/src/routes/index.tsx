import { createBrowserRouter } from 'react-router'

import Index from 'src/pages'
import Layout from 'src/pages/layout'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout />,
		children: [
			{ index: true, element: <Index /> },
		],
	},
])
