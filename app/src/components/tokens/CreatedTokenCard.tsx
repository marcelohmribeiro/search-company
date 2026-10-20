import { Check, Copy, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { settings } from 'src/config'
import type { CreatedApiToken } from 'src/types'

/** Linhas para o `~/.zshrc`: a skill `proposta-site` lê a API e o token dessas variáveis. */
const envSnippet = (token: string) =>
	`export SEARCH_COMPANY_API_URL="${settings.API_URL}"\nexport SEARCH_COMPANY_TOKEN="${token}"`

/** Mostra o token recém-criado uma única vez, já no formato para colar no terminal. */
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
		<Card className='border-emerald-200 bg-emerald-50/40'>
			<CardHeader>
				<CardTitle>Token "{created.name}" criado</CardTitle>
				<CardDescription className='flex items-start gap-1.5 text-amber-700'>
					<TriangleAlert className='mt-0.5 size-4 shrink-0' />
					Copie agora: este valor não aparece de novo.
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-3'>
				<pre className='overflow-x-auto rounded-md border bg-background p-3 text-xs'>{snippet}</pre>
				<p className='text-sm text-muted-foreground'>
					Cole essas duas linhas no final do <code className='font-mono'>~/.zshrc</code> e abra um terminal novo. Depois é só
					pedir ao Claude algo como "faz as propostas dos leads que estão fazendo".
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
