import { Outlet } from 'react-router'

export default function Layout() {
	return (
		<div className='flex min-h-screen w-full'>
			<Outlet />
		</div>
	)
}
