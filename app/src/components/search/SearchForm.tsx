import { useMemo, useState } from 'react'
import { CircleAlert, KeyRound, MapPin, Search, Square, TriangleAlert } from 'lucide-react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import GoogleApiKeyField from 'src/components/search/GoogleApiKeyField'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'src/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from 'src/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from 'src/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { Spinner } from 'src/components/ui/spinner'
import { Switch } from 'src/components/ui/switch'
import { Textarea } from 'src/components/ui/textarea'
import { formatNumber, plural } from 'src/lib/format'
import { parseList, textQuery } from 'src/lib/search'
import { useApiKeyStore } from 'src/store/apiKeyStore'
import { useUsageStore } from 'src/store/usageStore'
import type { SearchCombo, SearchRequest } from 'src/types'

const PAGE_OPTIONS = [
	{ value: '1', label: '1 página · até 20 empresas' },
	{ value: '2', label: '2 páginas · até 40 empresas' },
	{ value: '3', label: '3 páginas · até 60 empresas' },
]

const PREVIEW_LIMIT = 5

interface SearchFormProps {
	running: boolean
	stopping: boolean
	onRun: (request: SearchRequest) => void
	onStop: () => void
}

function ParsedItems({ items }: { items: string[] }) {
	if (!items.length) return null
	return (
		<div className='flex flex-wrap gap-1'>
			{items.map((item) => (
				<Badge key={item} variant='secondary'>
					{item}
				</Badge>
			))}
		</div>
	)
}

export default function SearchForm({ running, stopping, onRun, onStop }: SearchFormProps) {
	const usage = useUsageStore((state) => state.usage)
	const apiKey = useApiKeyStore((state) => state.apiKey.trim())
	const [city, setCity] = useState('')
	const [categoriesText, setCategoriesText] = useState('')
	const [neighborhoodsText, setNeighborhoodsText] = useState('')
	const [maxPages, setMaxPages] = useState(3)
	const [skipIfDone, setSkipIfDone] = useState(true)
	const [confirmOpen, setConfirmOpen] = useState(false)

	const categories = useMemo(() => parseList(categoriesText), [categoriesText])
	const neighborhoods = useMemo(() => parseList(neighborhoodsText), [neighborhoodsText])
	const combos = useMemo<SearchCombo[]>(
		() =>
			categories.flatMap((category) =>
				neighborhoods.length ? neighborhoods.map((neighborhood) => ({ category, neighborhood })) : [{ category }],
			),
		[categories, neighborhoods],
	)

	const cityName = city.trim().replace(/\s+/g, ' ')
	const estimate = combos.length * maxPages
	const remaining = usage?.remaining ?? 0
	const hasApiKey = apiKey !== ''
	const canRun = !running && hasApiKey && cityName !== '' && combos.length > 0 && remaining > 0

	function confirm() {
		setConfirmOpen(false)
		onRun({ apiKey, city: cityName, combos, maxPages, skipIfDone })
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Nova busca</CardTitle>
				<CardDescription>Cada combinação de categoria e bairro vira uma busca no Google Maps.</CardDescription>
			</CardHeader>

			<CardContent>
				<FieldGroup>
					<GoogleApiKeyField disabled={running} />

					<FieldSeparator />

					<Field data-disabled={running}>
						<FieldLabel htmlFor='city'>Cidade</FieldLabel>
						<InputGroup>
							<InputGroupAddon>
								<MapPin />
							</InputGroupAddon>
							<InputGroupInput
								id='city'
								value={city}
								onChange={(event) => setCity(event.target.value)}
								placeholder='Ex.: Fortaleza'
								disabled={running}
							/>
						</InputGroup>
					</Field>

					<Field data-disabled={running}>
						<FieldLabel htmlFor='categories'>Categorias</FieldLabel>
						<Textarea
							id='categories'
							value={categoriesText}
							onChange={(event) => setCategoriesText(event.target.value)}
							placeholder={'barbearia\nsalão de beleza\npet shop'}
							rows={4}
							disabled={running}
						/>
						<FieldDescription>Uma por linha ou separadas por vírgula.</FieldDescription>
						<ParsedItems items={categories} />
					</Field>

					<Field data-disabled={running}>
						<FieldLabel htmlFor='neighborhoods'>
							Bairros <span className='font-normal text-muted-foreground'>(opcional)</span>
						</FieldLabel>
						<Textarea
							id='neighborhoods'
							value={neighborhoodsText}
							onChange={(event) => setNeighborhoodsText(event.target.value)}
							placeholder={'Aldeota\nMeireles'}
							rows={4}
							disabled={running}
						/>
						<FieldDescription>Sem bairro, a busca cobre a cidade toda.</FieldDescription>
						<ParsedItems items={neighborhoods} />
					</Field>

					<Field data-disabled={running}>
						<FieldLabel htmlFor='pages'>Páginas por busca</FieldLabel>
						<Select value={String(maxPages)} onValueChange={(value) => setMaxPages(Number(value))} disabled={running}>
							<SelectTrigger id='pages' className='w-full'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PAGE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FieldDescription>Cada página gasta 1 requisição.</FieldDescription>
					</Field>

					<Field orientation='horizontal' data-disabled={running}>
						<FieldContent>
							<FieldLabel htmlFor='skip-if-done'>Pular buscas já feitas</FieldLabel>
							<FieldDescription>Repetir uma busca concluída não gasta requisição.</FieldDescription>
						</FieldContent>
						<Switch id='skip-if-done' checked={skipIfDone} onCheckedChange={setSkipIfDone} disabled={running} />
					</Field>
				</FieldGroup>
			</CardContent>

			<CardFooter className='flex-col items-stretch gap-3'>
				<div className='space-y-1 text-sm'>
					<div className='flex items-baseline justify-between gap-2'>
						<span className='text-muted-foreground'>Custo estimado</span>
						<span className='font-medium tabular-nums'>até {plural(estimate, 'requisição', 'requisições')}</span>
					</div>
					<p className='text-xs text-muted-foreground'>
						{plural(combos.length, 'busca', 'buscas')} × {plural(maxPages, 'página', 'páginas')} · restam{' '}
						{formatNumber(remaining)} no mês
					</p>
					{!hasApiKey && (
						<p className='flex items-center gap-1.5 pt-1 text-xs text-amber-700'>
							<KeyRound className='size-3.5' />
							Informe a chave da API do Google para buscar.
						</p>
					)}
					{usage && remaining === 0 && (
						<p className='flex items-center gap-1.5 pt-1 text-xs text-destructive'>
							<CircleAlert className='size-3.5' />A cota do mês acabou. Novas buscas só no próximo mês.
						</p>
					)}
					{remaining > 0 && estimate > remaining && (
						<p className='flex items-center gap-1.5 pt-1 text-xs text-amber-700'>
							<TriangleAlert className='size-3.5' />
							Passa do que resta: as buscas param ao chegar no limite.
						</p>
					)}
				</div>

				{running ? (
					<div className='flex gap-2'>
						<Button size='lg' className='flex-1' disabled>
							<Spinner />
							Buscando…
						</Button>
						<Button size='lg' variant='outline' onClick={onStop} disabled={stopping}>
							<Square />
							{stopping ? 'Parando…' : 'Parar'}
						</Button>
					</div>
				) : (
					<Button size='lg' disabled={!canRun} onClick={() => setConfirmOpen(true)}>
						<Search />
						Buscar
					</Button>
				)}
			</CardFooter>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent className='data-[size=default]:sm:max-w-md'>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar busca</AlertDialogTitle>
						<AlertDialogDescription>
							Pode usar até <strong className='text-foreground'>{plural(estimate, 'requisição', 'requisições')}</strong>{' '}
							da cota do mês. Restam {formatNumber(remaining)}.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<ul className='space-y-1 rounded-lg border bg-muted/50 p-3 text-sm'>
						{combos.slice(0, PREVIEW_LIMIT).map((combo) => (
							<li key={`${combo.category}|${combo.neighborhood}`} className='truncate'>
								{textQuery(combo.category, combo.neighborhood, cityName)}
							</li>
						))}
						{combos.length > PREVIEW_LIMIT && (
							<li className='text-muted-foreground'>e mais {plural(combos.length - PREVIEW_LIMIT, 'busca', 'buscas')}</li>
						)}
					</ul>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={confirm}>Buscar</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}
