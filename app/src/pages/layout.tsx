import { NavLink, Outlet } from 'react-router'
import { LogOut, MapPinned, Search, Users } from 'lucide-react'
import UsageMeter from 'src/components/UsageMeter'
import { Button } from 'src/components/ui/button'
import { Toaster } from 'src/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/ui/tooltip'
import { cn } from 'src/lib/utils'
import { useAuthStore } from 'src/store/authStore'
import { useLeadsViewStore } from 'src/store/leadsViewStore'

const NAV_ITEMS = [
	{ to: '/', label: 'Buscar', icon: Search, end: true },
	{ to: '/leads', label: 'Leads', icon: Users, end: false },
]

export default function Layout() {
	const leadsSearch = useLeadsViewStore((state) => state.search)
	const { user, signOut } = useAuthStore()

	return (
		<TooltipProvider>
			<div className='flex min-h-screen flex-col bg-muted/40'>
				<header className='sticky top-0 z-30 border-b bg-background/85 backdrop-blur'>
					<div className='mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6'>
						<div className='flex items-center gap-2.5'>
							<div className='flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
								<MapPinned className='size-4' />
							</div>
							<span className='font-heading font-semibold tracking-tight'>Search Company</span>
						</div>

						<nav className='flex items-center gap-1'>
							{NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
								<NavLink
									key={to}
									to={to === '/leads' ? `/leads${leadsSearch}` : to}
									end={end}
									className={({ isActive }) =>
										cn(
											'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
											isActive
												? 'bg-muted text-foreground'
												: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
										)
									}
								>
									<Icon className='size-4' />
									{label}
								</NavLink>
							))}
						</nav>

						<div className='flex w-full items-center gap-3 sm:ml-auto sm:w-auto'>
							<div className='flex-1 sm:flex-none'>
								<UsageMeter />
							</div>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant='ghost' size='icon-sm' onClick={signOut} aria-label='Sair'>
										<LogOut />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Sair{user && ` (${user.email})`}</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</header>

				<main className='mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6'>
					<Outlet />
				</main>

				<footer className='border-t bg-background'>
					<div className='mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6'>
						Dados das empresas: Google Maps
					</div>
				</footer>
			</div>
			<Toaster position='bottom-right' />
		</TooltipProvider>
	)
}
