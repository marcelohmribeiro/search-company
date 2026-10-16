import { NavLink, Outlet } from 'react-router'
import UsageBadge from 'src/components/UsageBadge'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	`rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200'}`

export default function Layout() {
	return (
		<div className='flex min-h-screen w-full flex-col bg-zinc-50 text-zinc-900'>
			<header className='border-b border-zinc-200 bg-white'>
				<div className='mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3'>
					<span className='text-lg font-semibold'>Search Company</span>
					<nav className='flex gap-1'>
						<NavLink to='/' end className={navLinkClass}>
							Busca
						</NavLink>
						<NavLink to='/leads' className={navLinkClass}>
							Leads
						</NavLink>
					</nav>
					<div className='ml-auto'>
						<UsageBadge />
					</div>
				</div>
			</header>
			<main className='mx-auto w-full max-w-7xl flex-1 px-4 py-6'>
				<Outlet />
			</main>
			<footer className='px-4 py-4 text-center text-xs text-zinc-500'>Dados das empresas: Google Maps</footer>
		</div>
	)
}
