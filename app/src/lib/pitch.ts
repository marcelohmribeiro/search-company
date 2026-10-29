import { whatsappUrl } from 'src/lib/phone'
import type { Lead, PitchBlock } from 'src/types'

export const SELLER_PLACEHOLDER = '{{vendedor}}'

const DAY_MS = 24 * 60 * 60_000

export const hasSellerPlaceholder = (text: string) => text.includes(SELLER_PLACEHOLDER)

/** Troca `{{vendedor}}` pelo nome do usuário; sem nome, deixa o placeholder. */
export const fillSeller = (text: string, displayName: string | null | undefined) =>
	displayName ? text.replaceAll(SELLER_PLACEHOLDER, displayName) : text

/** Link do WhatsApp do contato: um link pronto, um número ou, sem ele, o telefone do lead. */
export function contactWhatsappUrl(contact: string | null, lead: Lead) {
	const value = contact?.trim()
	if (!value) return whatsappUrl(lead.internationalPhone)
	if (/^https?:\/\//i.test(value)) return value
	const digits = value.replace(/\D/g, '')
	if (!digits) return whatsappUrl(lead.internationalPhone)
	return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`
}

/** Junta o link do WhatsApp com o texto, quando o link é do wa.me. */
export function whatsappWithText(url: string, text: string) {
	if (!/^https:\/\/wa\.me\//.test(url)) return url
	return `${url}?text=${encodeURIComponent(text)}`
}

export type FollowUpState = 'overdue' | 'today' | 'upcoming'

/** Situação do próximo follow-up no dia local do navegador. */
export function followUpState(nextFollowUpAt: string | null): FollowUpState | null {
	if (!nextFollowUpAt) return null
	const due = new Date(nextFollowUpAt)
	const now = new Date()
	if (due.getTime() <= now.getTime()) return due.toDateString() === now.toDateString() ? 'today' : 'overdue'
	return due.toDateString() === now.toDateString() ? 'today' : 'upcoming'
}

/** Data em que uma mensagem deve sair, a partir do envio da principal. */
export function messageDueAt(blocks: PitchBlock[], dayOffset: number) {
	const main = blocks.find((block) => block.type === 'message' && block.group === 'main' && block.sentAt)
	if (!main || main.type !== 'message' || !main.sentAt) return null
	return new Date(new Date(main.sentAt).getTime() + dayOffset * DAY_MS).toISOString()
}

export function newBlock(type: PitchBlock['type']): PitchBlock {
	const id = crypto.randomUUID()
	if (type === 'markdown') return { type, id, title: '', body: '' }
	if (type === 'message') return { type, id, label: '', group: 'followup', dayOffset: 3, body: '', sentAt: null }
	return { type, id, title: '', items: [] }
}
