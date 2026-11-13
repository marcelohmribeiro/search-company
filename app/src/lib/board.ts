import { settings } from 'src/config'
import type { BoardColumn, ProjectCard } from 'src/types'

export const BOARD_COLUMNS: { value: BoardColumn; label: string; dotClassName: string }[] = [
	{ value: 'BACKLOG', label: 'Backlog', dotClassName: 'bg-zinc-400' },
	{ value: 'PROPOSAL', label: 'Proposta', dotClassName: 'bg-fuchsia-500' },
	{ value: 'TODO', label: 'Fazer', dotClassName: 'bg-indigo-500' },
	{ value: 'REVIEW', label: 'Revisão', dotClassName: 'bg-amber-500' },
	{ value: 'DONE', label: 'Concluído', dotClassName: 'bg-emerald-500' },
]

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

const PROJECT_COLORS = [
	'border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
	'border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300',
	'border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
	'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
	'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
	'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300',
	'border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300',
	'border-fuchsia-200 dark:border-fuchsia-900 bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300',
]

/** Cor estável do projeto, calculada a partir do id do lead. */
export function projectColor(leadId: string) {
	let hash = 0
	for (const char of leadId) hash = (hash * 31 + char.charCodeAt(0)) | 0
	return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

/** Imagens em disco (dev) vêm como `/uploads/...` e são servidas pela API. */
export function cardImageSrc(url: string) {
	return url.startsWith('/uploads/') ? `${settings.API_URL.replace(/\/$/, '')}${url}` : url
}

/** Posição para soltar um card antes de `beforeId` (ou no fim) da coluna, ignorando o próprio card. */
export function dropPosition(cards: ProjectCard[], movingId: number, beforeId: number | null) {
	const list = cards.filter((card) => card.id !== movingId)
	const index = beforeId === null ? list.length : list.findIndex((card) => card.id === beforeId)
	const prev = list[index - 1]?.position
	const next = list[index]?.position
	if (prev === undefined && next === undefined) return 1
	if (prev === undefined) return next! - 1
	if (next === undefined) return prev + 1
	return (prev + next) / 2
}

/** Tamanho máximo do original escolhido ou colado; ele é reduzido no navegador antes do envio. */
export const IMAGE_SOURCE_MAX_BYTES = 25 * 1024 * 1024
const IMAGE_MAX_SIDE = 1600

/** Reduz para no máximo 1600px e converte para WebP no navegador, para o envio ser leve e rápido. */
export async function compressImage(file: File): Promise<File> {
	const bitmap = await createImageBitmap(file)
	const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(bitmap.width * scale)
	canvas.height = Math.round(bitmap.height * scale)
	canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
	bitmap.close()
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
	if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file
	return new File([blob], 'image.webp', { type: 'image/webp' })
}
export const MAX_PROPOSALS = 10
