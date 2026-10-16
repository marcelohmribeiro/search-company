import type { BusinessStatus, LeadStatus, SearchStatus, SiteStatus } from 'src/types'

export const SITE_STATUS_OPTIONS: { value: SiteStatus; label: string; className: string }[] = [
	{ value: 'NO_WEBSITE', label: 'Sem site', className: 'bg-emerald-100 text-emerald-800' },
	{ value: 'INSTAGRAM_ONLY', label: 'Só Instagram', className: 'bg-pink-100 text-pink-800' },
	{ value: 'WHATSAPP_ONLY', label: 'Só WhatsApp', className: 'bg-green-100 text-green-800' },
	{ value: 'FACEBOOK_ONLY', label: 'Só Facebook', className: 'bg-blue-100 text-blue-800' },
	{ value: 'LINK_AGGREGATOR', label: 'Agregador de links', className: 'bg-amber-100 text-amber-800' },
	{ value: 'HAS_WEBSITE', label: 'Tem site', className: 'bg-zinc-200 text-zinc-700' },
]

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
	{ value: 'NEW', label: 'Novo' },
	{ value: 'CONTACTED', label: 'Contatado' },
	{ value: 'REPLIED', label: 'Respondeu' },
	{ value: 'CLOSED', label: 'Fechado' },
	{ value: 'DISCARDED', label: 'Descartado' },
]

export const BUSINESS_STATUS_OPTIONS: { value: BusinessStatus; label: string }[] = [
	{ value: 'OPERATIONAL', label: 'Funcionando' },
	{ value: 'CLOSED_TEMPORARILY', label: 'Fechada temporariamente' },
	{ value: 'CLOSED_PERMANENTLY', label: 'Fechada definitivamente' },
	{ value: 'FUTURE_OPENING', label: 'Abre em breve' },
]

export const businessStatusLabel = (value: BusinessStatus | null) =>
	BUSINESS_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? null

export const SEARCH_STATUS_LABELS: Record<SearchStatus, string> = {
	RUNNING: 'Em andamento',
	DONE: 'Concluída',
	LIMIT_REACHED: 'Parou no limite',
	FAILED: 'Erro',
}

export const siteStatusOption = (value: SiteStatus) =>
	SITE_STATUS_OPTIONS.find((option) => option.value === value) ?? SITE_STATUS_OPTIONS[5]
