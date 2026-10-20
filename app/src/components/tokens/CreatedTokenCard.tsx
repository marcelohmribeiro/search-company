import { Check, Copy, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { settings } from 'src/config'
import type { CreatedApiToken } from 'src/types'

/** Bloco `env` do `~/.claude/settings.json` com a URL da API e o token. */
const envSnippet = (token: string) =>
	JSON.stringify({ env: { SEARCH_COMPANY_API_URL: settings.API_URL, SEARCH_COMPANY_TOKEN: token } }, null, 2)

export default function CreatedTokenCard({ created, onDone }: { created: CreatedApiToken; onDone: () => void }) {
	const [copied, setCopied] = useState(false)
	const snippet = envSnippet(created.token)

	async function copy() {
		try {
			await navigator.clipboard.writeText(snippet)
			setCopied(true)
			toast.success('Copiado')
		} catch {
			toast.error('Não foi possível copiar', { description: 'O navegador bloqueou o acesso à área de transferência.' })
		}
	}

	return (
		<Card className='border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/40'>
			<CardHeader>
				<CardTitle>Token "{created.name}" criado</CardTitle>
				<CardDescription className='flex items-start gap-1.5 text-amber-700 dark:text-amber-300'>
					<TriangleAlert className='mt-0.5 size-4 shrink-0' />
					Copie agora: este valor não aparece de novo.
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-3'>
				<pre className='overflow-x-auto rounded-md border bg-background p-3 text-xs'>{snippet}</pre>
				<p className='text-sm text-muted-foreground'>
					Coloque as duas variáveis no bloco <code className='font-mono'>env</code> do{' '}
					<code className='font-mono'>~/.claude/settings.json</code> (se o bloco já existir, junte com o que tem lá) e abra uma
					sessão nova do Claude Code. Depois é só pedir algo como "faz as propostas dos leads que estão fazendo".
				</p>
				<div className='flex gap-2'>
					<Button onClick={copy}>
						{copied ? <Check /> : <Copy />}
						Copiar
					</Button>
					<Button variant='ghost' onClick={onDone}>
						Já copiei
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
