import type { BusinessStatus, LeadStatus, SearchStatus, SiteStatus } from 'src/types'

interface Option<T> {
	value: T
	label: string
}

/** `className` colore o badge da situação do site e `dotClassName`, o marcador do filtro. */
export const SITE_STATUS_OPTIONS: (Option<SiteStatus> & { className: string; dotClassName: string })[] = [
	{ value: 'NO_WEBSITE', label: 'Sem site', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', dotClassName: 'bg-emerald-500' },
	{ value: 'INSTAGRAM_ONLY', label: 'Só Instagram', className: 'border-pink-200 bg-pink-50 text-pink-700', dotClassName: 'bg-pink-500' },
	{ value: 'WHATSAPP_ONLY', label: 'Só WhatsApp', className: 'border-green-200 bg-green-50 text-green-700', dotClassName: 'bg-green-500' },
	{ value: 'FACEBOOK_ONLY', label: 'Só Facebook', className: 'border-blue-200 bg-blue-50 text-blue-700', dotClassName: 'bg-blue-500' },
	{ value: 'LINK_AGGREGATOR', label: 'Agregador de links', className: 'border-amber-200 bg-amber-50 text-amber-700', dotClassName: 'bg-amber-500' },
	{ value: 'HAS_WEBSITE', label: 'Tem site', className: 'border-zinc-200 bg-zinc-50 text-zinc-600', dotClassName: 'bg-zinc-400' },
]

/** `dotClassName` é a cor do marcador do status no select. */
export const LEAD_STATUS_OPTIONS: (Option<LeadStatus> & { dotClassName: string })[] = [
	{ value: 'NEW', label: 'Novo', dotClassName: 'bg-sky-500' },
	{ value: 'CONTACTED', label: 'Contatado', dotClassName: 'bg-amber-500' },
	{ value: 'REPLIED', label: 'Respondeu', dotClassName: 'bg-violet-500' },
	{ value: 'CLOSED', label: 'Fechado', dotClassName: 'bg-emerald-500' },
	{ value: 'DISCARDED', label: 'Descartado', dotClassName: 'bg-zinc-400' },
]

export const BUSINESS_STATUS_OPTIONS: Option<BusinessStatus>[] = [
	{ value: 'OPERATIONAL', label: 'Funcionando' },
	{ value: 'CLOSED_TEMPORARILY', label: 'Fechada temporariamente' },
	{ value: 'CLOSED_PERMANENTLY', label: 'Fechada definitivamente' },
	{ value: 'FUTURE_OPENING', label: 'Abre em breve' },
]

export const SEARCH_STATUS_OPTIONS: Record<SearchStatus, { label: string; className: string }> = {
	RUNNING: { label: 'Em andamento', className: 'border-sky-200 bg-sky-50 text-sky-700' },
	DONE: { label: 'Concluída', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
	LIMIT_REACHED: { label: 'Parou no limite', className: 'border-amber-200 bg-amber-50 text-amber-700' },
	FAILED: { label: 'Erro', className: 'border-red-200 bg-red-50 text-red-700' },
}

export const PRICE_LEVEL_LABELS: Record<string, string> = {
	PRICE_LEVEL_INEXPENSIVE: '$ · barato',
	PRICE_LEVEL_MODERATE: '$$ · moderado',
	PRICE_LEVEL_EXPENSIVE: '$$$ · caro',
	PRICE_LEVEL_VERY_EXPENSIVE: '$$$$ · muito caro',
}

export const businessStatusLabel = (value: BusinessStatus | null) =>
	BUSINESS_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? null

export const siteStatusOption = (value: SiteStatus) =>
	SITE_STATUS_OPTIONS.find((option) => option.value === value) ?? SITE_STATUS_OPTIONS[5]
