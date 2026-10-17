const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const numberFormatter = new Intl.NumberFormat('pt-BR')
const ratingFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** "16/10/2026, 18:30" a partir de uma data ISO. */
export const formatDateTime = (iso: string) => dateTimeFormatter.format(new Date(iso))

/** Número com separador de milhar ("1.234"). */
export const formatNumber = (value: number) => numberFormatter.format(value)

/** Nota com uma casa decimal e vírgula ("4,5"). */
export const formatRating = (value: number) => ratingFormatter.format(value)

/** Frase com plural simples: `plural(2, 'busca', 'buscas')` vira "2 buscas". */
export const plural = (count: number, singular: string, pluralForm: string) =>
	`${formatNumber(count)} ${count === 1 ? singular : pluralForm}`
