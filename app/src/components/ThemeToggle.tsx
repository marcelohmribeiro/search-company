import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from 'src/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip'

export default function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme()
	const dark = resolvedTheme === 'dark'
	const label = dark ? 'Usar tema claro' : 'Usar tema escuro'

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant='ghost' size='icon-sm' onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={label}>
					{dark ? <Sun /> : <Moon />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	)
}
