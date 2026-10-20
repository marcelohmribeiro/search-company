import type { BusinessStatus, LeadOrder, LeadStatus, SearchStatus, SiteStatus, UserRole } from 'src/types'

interface Option<T> {
	value: T
	label: string
}

export const SITE_STATUS_OPTIONS: (Option<SiteStatus> & { className: string; dotClassName: string })[] = [
	{ value: 'NO_WEBSITE', label: 'Sem site', className: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300', dotClassName: 'bg-emerald-500' },
	{ value: 'INSTAGRAM_ONLY', label: 'Só Instagram', className: 'border-pink-200 dark:border-pink-900 bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300', dotClassName: 'bg-pink-500' },
	{ value: 'WHATSAPP_ONLY', label: 'Só WhatsApp', className: 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300', dotClassName: 'bg-green-500' },
	{ value: 'FACEBOOK_ONLY', label: 'Só Facebook', className: 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300', dotClassName: 'bg-blue-500' },
	{ value: 'LINK_AGGREGATOR', label: 'Agregador de links', className: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300', dotClassName: 'bg-amber-500' },
	{ value: 'HAS_WEBSITE', label: 'Tem site', className: 'border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400', dotClassName: 'bg-zinc-400' },
]

export const LEAD_STATUS_OPTIONS: (Option<LeadStatus> & { dotClassName: string })[] = [
	{ value: 'NEW', label: 'Novo', dotClassName: 'bg-sky-500' },
	{ value: 'IN_PROGRESS', label: 'Fazendo', dotClassName: 'bg-orange-500' },
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

export const LEAD_ORDER_OPTIONS: Option<LeadOrder>[] = [
	{ value: 'reviews', label: 'Mais avaliações primeiro' },
	{ value: 'rating', label: 'Maior nota primeiro' },
	{ value: 'name', label: 'Nome (A–Z)' },
	{ value: 'recent', label: 'Mais recentes primeiro' },
]

export const MIN_RATING_OPTIONS: Option<string>[] = [
	{ value: '3.5', label: 'Nota 3,5 ou mais' },
	{ value: '4', label: 'Nota 4,0 ou mais' },
	{ value: '4.5', label: 'Nota 4,5 ou mais' },
]

export const SEARCH_STATUS_OPTIONS: Record<SearchStatus, { label: string; className: string }> = {
	RUNNING: { label: 'Em andamento', className: 'border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300' },
	DONE: { label: 'Concluída', className: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
	LIMIT_REACHED: { label: 'Parou no limite', className: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
	FAILED: { label: 'Erro', className: 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300' },
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

export const leadStatusOption = (value: LeadStatus) =>
	LEAD_STATUS_OPTIONS.find((option) => option.value === value) ?? LEAD_STATUS_OPTIONS[0]

export const ROLE_LABELS: Record<UserRole, string> = {
	ADMIN: 'Administrador',
	USER: 'Usuário',
}
