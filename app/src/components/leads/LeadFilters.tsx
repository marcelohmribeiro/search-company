import { memo } from 'react'
import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Input } from 'src/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from 'src/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { Separator } from 'src/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from 'src/components/ui/toggle-group'
import {
	BUSINESS_STATUS_OPTIONS,
	LEAD_ORDER_OPTIONS,
	LEAD_STATUS_OPTIONS,
	MIN_RATING_OPTIONS,
	PITCH_FILTER_OPTIONS,
	SITE_STATUS_OPTIONS,
} from 'src/constants/labels'
import { cn } from 'src/lib/utils'
import type { BusinessStatus, LeadFilterOptions, LeadFilters as Filters, LeadOrder, LeadStatus, PitchFilter, SiteStatus } from 'src/types'

const ALL = 'all'

const CHIP_CLASS =
	'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'

interface LeadFiltersProps {
	filters: Filters
	options: LeadFilterOptions
	onChange: (changes: Partial<Filters>) => void
	onReset: () => void
}

function OptionSelect({
	value,
	onChange,
	placeholder,
	items,
}: {
	value: string
	onChange: (value: string) => void
	placeholder: string
	items: string[]
}) {
	return (
		<Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? '' : next)}>
			<SelectTrigger className='w-full'>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL}>{placeholder}</SelectItem>
				{items.map((item) => (
					<SelectItem key={item} value={item}>
						{item}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
			<span className='w-28 shrink-0 text-sm text-muted-foreground'>{label}</span>
			{children}
		</div>
	)
}

function Dot({ className }: { className: string }) {
	return <span className={cn('size-2 shrink-0 rounded-full', className)} />
}

function LeadFilters({ filters, options, onChange, onReset }: LeadFiltersProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Filtros</CardTitle>
				<CardAction>
					<Button variant='ghost' size='sm' onClick={onReset}>
						<X />
						Limpar filtros
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent className='space-y-4'>
				<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
					<InputGroup className='sm:col-span-2'>
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
						<InputGroupInput
							value={filters.q}
							onChange={(event) => onChange({ q: event.target.value })}
							placeholder='Buscar pelo nome da empresa'
						/>
					</InputGroup>
					<OptionSelect
						value={filters.city}
						onChange={(city) => onChange({ city })}
						placeholder='Todas as cidades'
						items={options.cities}
					/>
					<OptionSelect
						value={filters.category}
						onChange={(category) => onChange({ category })}
						placeholder='Todas as categorias'
						items={options.categories}
					/>
					<OptionSelect
						value={filters.neighborhood}
						onChange={(neighborhood) => onChange({ neighborhood })}
						placeholder='Todos os bairros'
						items={options.neighborhoods}
					/>
					<Select
						value={filters.minRating || ALL}
						onValueChange={(value) => onChange({ minRating: value === ALL ? '' : value })}
					>
						<SelectTrigger className='w-full'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Qualquer nota</SelectItem>
							{MIN_RATING_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Input
						type='number'
						min={0}
						value={filters.minReviews}
						onChange={(event) => onChange({ minReviews: event.target.value })}
						placeholder='Mínimo de avaliações'
					/>
					<Select value={filters.orderBy} onValueChange={(value) => onChange({ orderBy: value as LeadOrder })}>
						<SelectTrigger className='w-full'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LEAD_ORDER_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Separator />

				<div className='space-y-3'>
					<ChipRow label='Site'>
						<ToggleGroup
							type='multiple'
							variant='outline'
							size='sm'
							spacing={1.5}
							className='flex-wrap'
							value={filters.siteStatus}
							onValueChange={(value) => onChange({ siteStatus: value as SiteStatus[] })}
						>
							{SITE_STATUS_OPTIONS.map((option) => (
								<ToggleGroupItem key={option.value} value={option.value} className={CHIP_CLASS}>
									<Dot className={option.dotClassName} />
									{option.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</ChipRow>
					<ChipRow label='Status'>
						<ToggleGroup
							type='multiple'
							variant='outline'
							size='sm'
							spacing={1.5}
							className='flex-wrap'
							value={filters.status}
							onValueChange={(value) => onChange({ status: value as LeadStatus[] })}
						>
							{LEAD_STATUS_OPTIONS.map((option) => (
								<ToggleGroupItem key={option.value} value={option.value} className={CHIP_CLASS}>
									<Dot className={option.dotClassName} />
									{option.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</ChipRow>
					<ChipRow label='Funcionamento'>
						<ToggleGroup
							type='multiple'
							variant='outline'
							size='sm'
							spacing={1.5}
							className='flex-wrap'
							value={filters.businessStatus}
							onValueChange={(value) => onChange({ businessStatus: value as BusinessStatus[] })}
						>
							{BUSINESS_STATUS_OPTIONS.map((option) => (
								<ToggleGroupItem key={option.value} value={option.value} className={CHIP_CLASS}>
									{option.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</ChipRow>
					<ChipRow label='Plano de venda'>
						<ToggleGroup
							type='single'
							variant='outline'
							size='sm'
							spacing={1.5}
							className='flex-wrap'
							value={filters.pitch}
							onValueChange={(value) => onChange({ pitch: value as PitchFilter })}
						>
							{PITCH_FILTER_OPTIONS.map((option) => (
								<ToggleGroupItem key={option.value} value={option.value} className={CHIP_CLASS}>
									{option.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</ChipRow>
				</div>
			</CardContent>
		</Card>
	)
}

export default memo(LeadFilters)
