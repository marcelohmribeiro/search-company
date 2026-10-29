import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Check, Copy, MessageCircle, Pencil, Plus, Trash2, Undo2, X } from 'lucide-react'
import PitchMarkdown from 'src/components/pitch/PitchMarkdown'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Checkbox } from 'src/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { Textarea } from 'src/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip'
import { PITCH_GROUP_LABELS } from 'src/constants/labels'
import { formatDate, formatDateTime } from 'src/lib/format'
import { fillSeller } from 'src/lib/pitch'
import { cn } from 'src/lib/utils'
import type { PitchBlock, PitchChecklistBlock, PitchMessageBlock, PitchMessageGroup } from 'src/types'

interface PitchBlockCardProps {
	block: PitchBlock
	/** Quando a mensagem deve sair, já calculado pelo envio da principal. */
	dueAt: string | null
	/** Nome que entra no lugar de `{{vendedor}}` no texto exibido. */
	displayName: string | null | undefined
	isFirst: boolean
	isLast: boolean
	busy: boolean
	onSave: (block: PitchBlock) => Promise<boolean>
	onMove: (direction: -1 | 1) => void
	onRemove: () => void
	onCopy: (block: PitchMessageBlock, openWhatsapp: boolean) => void
	onToggleSent: (block: PitchMessageBlock) => void
	onToggleItem: (block: PitchChecklistBlock, itemId: string, done: boolean) => void
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant='ghost' size='icon-sm' onClick={onClick} disabled={disabled} aria-label={label}>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	)
}

function blockTitle(block: PitchBlock) {
	if (block.type === 'message') return block.label || PITCH_GROUP_LABELS[block.group]
	return block.title || (block.type === 'checklist' ? 'Checklist' : 'Sem título')
}

function MessageEditor({ draft, onChange }: { draft: PitchMessageBlock; onChange: (draft: PitchMessageBlock) => void }) {
	return (
		<FieldGroup>
			<div className='grid gap-3 sm:grid-cols-[1fr_12rem_8rem]'>
				<Field>
					<FieldLabel>Rótulo</FieldLabel>
					<Input value={draft.label} onChange={(event) => onChange({ ...draft, label: event.target.value })} placeholder='Follow-up 1' />
				</Field>
				<Field>
					<FieldLabel>Tipo</FieldLabel>
					<Select value={draft.group} onValueChange={(group) => onChange({ ...draft, group: group as PitchMessageGroup })}>
						<SelectTrigger className='w-full'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(PITCH_GROUP_LABELS).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<Field>
					<FieldLabel>Dia</FieldLabel>
					<Input
						type='number'
						min={0}
						value={draft.dayOffset}
						onChange={(event) => onChange({ ...draft, dayOffset: Math.max(0, Number(event.target.value) || 0) })}
						disabled={draft.group === 'main'}
					/>
				</Field>
			</div>
			<Field>
				<FieldLabel>Texto</FieldLabel>
				<Textarea
					value={draft.body}
					onChange={(event) => onChange({ ...draft, body: event.target.value })}
					rows={7}
					placeholder='Oi! Sou {{vendedor}}…'
				/>
			</Field>
		</FieldGroup>
	)
}

function ChecklistEditor({ draft, onChange }: { draft: PitchChecklistBlock; onChange: (draft: PitchChecklistBlock) => void }) {
	const setItem = (index: number, text: string) =>
		onChange({ ...draft, items: draft.items.map((item, current) => (current === index ? { ...item, text } : item)) })
	return (
		<FieldGroup>
			<Field>
				<FieldLabel>Título</FieldLabel>
				<Input value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} placeholder='Antes de enviar' />
			</Field>
			<div className='space-y-2'>
				{draft.items.map((item, index) => (
					<div key={item.id} className='flex gap-2'>
						<Input value={item.text} onChange={(event) => setItem(index, event.target.value)} />
						<IconButton
							label='Remover item'
							onClick={() => onChange({ ...draft, items: draft.items.filter((_, current) => current !== index) })}
						>
							<X />
						</IconButton>
					</div>
				))}
				<Button
					variant='outline'
					size='sm'
					onClick={() => onChange({ ...draft, items: [...draft.items, { id: crypto.randomUUID(), text: '', done: false }] })}
				>
					<Plus />
					Item
				</Button>
			</div>
		</FieldGroup>
	)
}

export default function PitchBlockCard({
	block,
	dueAt,
	displayName,
	isFirst,
	isLast,
	busy,
	onSave,
	onMove,
	onRemove,
	onCopy,
	onToggleSent,
	onToggleItem,
}: PitchBlockCardProps) {
	const [draft, setDraft] = useState<PitchBlock | null>(null)
	const editing = draft !== null

	async function handleSave() {
		if (!draft) return
		const cleaned = draft.type === 'checklist' ? { ...draft, items: draft.items.filter((item) => item.text.trim()) } : draft
		if (await onSave(cleaned)) setDraft(null)
	}

	return (
		<Card className={cn(block.type === 'message' && block.sentAt && !editing && 'opacity-75')}>
			<CardHeader>
				<CardTitle className='flex flex-wrap items-center gap-2'>
					{blockTitle(block)}
					{block.type === 'message' && (
						<>
							<Badge variant='outline'>{PITCH_GROUP_LABELS[block.group]}</Badge>
							{block.group !== 'main' && <Badge variant='outline'>Dia {block.dayOffset}</Badge>}
							{block.sentAt ? (
								<Badge variant='outline' className='border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'>
									Enviada em {formatDateTime(block.sentAt)}
								</Badge>
							) : (
								dueAt && block.group === 'followup' && <Badge variant='outline'>Enviar em {formatDate(dueAt)}</Badge>
							)}
						</>
					)}
				</CardTitle>
				<CardAction className='flex gap-0.5'>
					{!editing && (
						<>
							<IconButton label='Subir' onClick={() => onMove(-1)} disabled={isFirst || busy}>
								<ArrowUp />
							</IconButton>
							<IconButton label='Descer' onClick={() => onMove(1)} disabled={isLast || busy}>
								<ArrowDown />
							</IconButton>
							<IconButton label='Editar' onClick={() => setDraft(block)} disabled={busy}>
								<Pencil />
							</IconButton>
							<IconButton label='Remover bloco' onClick={onRemove} disabled={busy}>
								<Trash2 />
							</IconButton>
						</>
					)}
				</CardAction>
			</CardHeader>

			<CardContent className='space-y-4'>
				{draft?.type === 'markdown' && (
					<FieldGroup>
						<Field>
							<FieldLabel>Título</FieldLabel>
							<Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder='Objeções' />
						</Field>
						<Field>
							<FieldLabel>Texto (Markdown)</FieldLabel>
							<Textarea
								value={draft.body}
								onChange={(event) => setDraft({ ...draft, body: event.target.value })}
								rows={12}
								className='font-mono text-xs'
							/>
						</Field>
					</FieldGroup>
				)}
				{draft?.type === 'message' && <MessageEditor draft={draft} onChange={setDraft} />}
				{draft?.type === 'checklist' && <ChecklistEditor draft={draft} onChange={setDraft} />}

				{editing ? (
					<div className='flex justify-end gap-2'>
						<Button variant='outline' onClick={() => setDraft(null)} disabled={busy}>
							Cancelar
						</Button>
						<Button onClick={handleSave} disabled={busy}>
							Salvar
						</Button>
					</div>
				) : (
					<>
						{block.type === 'markdown' && <PitchMarkdown>{block.body}</PitchMarkdown>}

						{block.type === 'message' && (
							<>
								<pre className='rounded-lg bg-muted p-3 font-sans text-sm whitespace-pre-wrap'>{fillSeller(block.body, displayName)}</pre>
								<div className='flex flex-wrap gap-2'>
									<Button size='sm' className='bg-green-600 text-white hover:bg-green-700' onClick={() => onCopy(block, true)}>
										<MessageCircle />
										Copiar e abrir WhatsApp
									</Button>
									<Button size='sm' variant='outline' onClick={() => onCopy(block, false)}>
										<Copy />
										Copiar
									</Button>
									<Button size='sm' variant='ghost' onClick={() => onToggleSent(block)} disabled={busy}>
										{block.sentAt ? <Undo2 /> : <Check />}
										{block.sentAt ? 'Desmarcar envio' : 'Marcar como enviada'}
									</Button>
								</div>
							</>
						)}

						{block.type === 'checklist' && (
							<ul className='space-y-2'>
								{block.items.map((item) => (
									<li key={item.id}>
										<label className='flex items-start gap-2.5 text-sm'>
											<Checkbox
												checked={item.done}
												onCheckedChange={(checked) => onToggleItem(block, item.id, checked === true)}
												className='mt-0.5'
											/>
											<span className={cn(item.done && 'text-muted-foreground line-through')}>{item.text}</span>
										</label>
									</li>
								))}
								{!block.items.length && <li className='text-sm text-muted-foreground'>Nenhum item.</li>}
							</ul>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}
