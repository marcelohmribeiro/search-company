import { useState } from 'react'
import { ExternalLink, MessageCircle, Pencil, Trash2, UserRound } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Field, FieldGroup, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { Textarea } from 'src/components/ui/textarea'
import type { PitchHeader } from 'src/types'

interface PitchHeaderCardProps {
	header: PitchHeader
	/** Link do WhatsApp que as mensagens usam. */
	whatsapp: string | null
	busy: boolean
	onSave: (header: PitchHeader) => Promise<boolean>
	onDelete: () => void
}

const toHeader = (draft: Record<keyof PitchHeader, string>): PitchHeader => ({
	demoUrl: draft.demoUrl.trim() || null,
	decisionMaker: draft.decisionMaker.trim() || null,
	contactWhatsapp: draft.contactWhatsapp.trim() || null,
	contactNotes: draft.contactNotes.trim() || null,
})

export default function PitchHeaderCard({ header, whatsapp, busy, onSave, onDelete }: PitchHeaderCardProps) {
	const [draft, setDraft] = useState<Record<keyof PitchHeader, string> | null>(null)
	const set = (key: keyof PitchHeader, value: string) => setDraft((current) => current && { ...current, [key]: value })

	async function handleSave() {
		if (draft && (await onSave(toHeader(draft)))) setDraft(null)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Contato e demonstração</CardTitle>
				<CardAction className='flex gap-0.5'>
					{!draft && (
						<>
							<Button
								variant='ghost'
								size='sm'
								onClick={() =>
									setDraft({
										demoUrl: header.demoUrl ?? '',
										decisionMaker: header.decisionMaker ?? '',
										contactWhatsapp: header.contactWhatsapp ?? '',
										contactNotes: header.contactNotes ?? '',
									})
								}
								disabled={busy}
							>
								<Pencil />
								Editar
							</Button>
							<Button variant='ghost' size='sm' onClick={onDelete} disabled={busy} className='text-destructive'>
								<Trash2 />
								Apagar plano
							</Button>
						</>
					)}
				</CardAction>
			</CardHeader>
			<CardContent>
				{draft ? (
					<FieldGroup>
						<div className='grid gap-3 sm:grid-cols-2'>
							<Field>
								<FieldLabel htmlFor='pitch-demo'>Link da demonstração</FieldLabel>
								<Input id='pitch-demo' value={draft.demoUrl} onChange={(event) => set('demoUrl', event.target.value)} placeholder='https://…vercel.app' />
							</Field>
							<Field>
								<FieldLabel htmlFor='pitch-decision'>Quem decide</FieldLabel>
								<Input id='pitch-decision' value={draft.decisionMaker} onChange={(event) => set('decisionMaker', event.target.value)} placeholder='Renata, fundadora e chef' />
							</Field>
							<Field className='sm:col-span-2'>
								<FieldLabel htmlFor='pitch-whatsapp'>WhatsApp de quem decide (número ou link)</FieldLabel>
								<Input
									id='pitch-whatsapp'
									value={draft.contactWhatsapp}
									onChange={(event) => set('contactWhatsapp', event.target.value)}
									placeholder='(85) 98722-1761 ou https://wa.link/…  · vazio usa o telefone do Google'
								/>
							</Field>
						</div>
						<Field>
							<FieldLabel htmlFor='pitch-contact-notes'>Observações do contato</FieldLabel>
							<Textarea id='pitch-contact-notes' value={draft.contactNotes} onChange={(event) => set('contactNotes', event.target.value)} rows={3} />
						</Field>
						<div className='flex justify-end gap-2'>
							<Button variant='outline' onClick={() => setDraft(null)} disabled={busy}>
								Cancelar
							</Button>
							<Button onClick={handleSave} disabled={busy}>
								Salvar
							</Button>
						</div>
					</FieldGroup>
				) : (
					<div className='space-y-3 text-sm'>
						<div className='flex flex-wrap gap-2'>
							{header.demoUrl && (
								<Button variant='outline' size='sm' asChild>
									<a href={header.demoUrl} target='_blank' rel='noreferrer'>
										<ExternalLink />
										Abrir demonstração
									</a>
								</Button>
							)}
							{whatsapp && (
								<Button variant='outline' size='sm' asChild>
									<a href={whatsapp} target='_blank' rel='noreferrer'>
										<MessageCircle className='text-green-600 dark:text-green-400' />
										WhatsApp {header.contactWhatsapp ? 'de quem decide' : 'do Google'}
									</a>
								</Button>
							)}
						</div>
						{header.decisionMaker && (
							<p className='flex items-center gap-2'>
								<UserRound className='size-4 text-muted-foreground' />
								{header.decisionMaker}
							</p>
						)}
						{header.contactNotes && <p className='whitespace-pre-wrap text-muted-foreground'>{header.contactNotes}</p>}
						{!header.demoUrl && !header.decisionMaker && !header.contactNotes && (
							<p className='text-muted-foreground'>Sem link da demonstração nem contato definidos.</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
