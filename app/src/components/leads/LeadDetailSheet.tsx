import { useState } from 'react'
import type { ReactNode } from 'react'
import { CalendarClock, Clock, ExternalLink, Globe, Images, MapPin, MessageCircle, MessageSquareText, Phone, Star, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import LeadStatusSelect from 'src/components/leads/LeadStatusSelect'
import SiteStatusBadge from 'src/components/leads/SiteStatusBadge'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Field, FieldGroup, FieldLabel } from 'src/components/ui/field'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from 'src/components/ui/sheet'
import { Spinner } from 'src/components/ui/spinner'
import { Textarea } from 'src/components/ui/textarea'
import { PRICE_LEVEL_LABELS, businessStatusLabel } from 'src/constants/labels'
import { formatDateTime, formatNumber, formatRating } from 'src/lib/format'
import { isBrazilianMobile, whatsappUrl } from 'src/lib/phone'
import { getErrorMessage, updateLead } from 'src/services'
import type { Lead, LeadStatus } from 'src/types'

interface LeadDetailSheetProps {
	lead: Lead | null
	open: boolean
	onOpenChange: (open: boolean) => void
	onSaved: (lead: Lead) => void
}

function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
	return (
		<div className='flex gap-3 px-3 py-2.5'>
			<Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
			<div className='min-w-0 flex-1'>
				<dt className='text-xs text-muted-foreground'>{label}</dt>
				<dd className='text-sm'>{children}</dd>
			</div>
		</div>
	)
}

function SectionTitle({ children }: { children: ReactNode }) {
	return <h3 className='mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase'>{children}</h3>
}

function LeadDetail({ lead, onSaved, onClose }: { lead: Lead; onSaved: (lead: Lead) => void; onClose: () => void }) {
	const [status, setStatus] = useState<LeadStatus>(lead.status)
	const [notes, setNotes] = useState(lead.notes ?? '')
	const [saving, setSaving] = useState(false)
	const whatsapp = whatsappUrl(lead.internationalPhone)
	const mobile = isBrazilianMobile(lead.internationalPhone)
	const closed = lead.businessStatus && lead.businessStatus !== 'OPERATIONAL'
	const subtitle = [
		lead.primaryTypeName ?? lead.category,
		lead.neighborhood ?? lead.searchNeighborhood,
		lead.state ? `${lead.city}/${lead.state}` : lead.city,
	]
		.filter(Boolean)
		.join(' · ')

	async function handleSave() {
		setSaving(true)
		try {
			onSaved(await updateLead(lead.id, { status, notes }))
			toast.success('Lead atualizado')
			onClose()
		} catch (error) {
			toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
		} finally {
			setSaving(false)
		}
	}

	return (
		<>
			<SheetHeader className='border-b pr-12'>
				<SheetTitle className='text-lg'>{lead.name}</SheetTitle>
				<SheetDescription>{subtitle}</SheetDescription>
				<div className='flex flex-wrap gap-1.5 pt-2'>
					<SiteStatusBadge status={lead.siteStatus} />
					{closed && (
						<Badge variant='outline' className='border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'>
							{businessStatusLabel(lead.businessStatus)}
						</Badge>
					)}
					{lead.pureServiceArea && <Badge variant='outline'>Sem endereço físico</Badge>}
				</div>
			</SheetHeader>

			<div className='flex-1 space-y-6 overflow-y-auto p-4'>
				<div className='grid grid-cols-3 gap-2'>
					{whatsapp && (
						<Button className='col-span-3 bg-green-600 text-white hover:bg-green-700' asChild>
							<a href={whatsapp} target='_blank' rel='noreferrer'>
								<MessageCircle />
								Conversar no WhatsApp
							</a>
						</Button>
					)}
					{lead.googleMapsUri && (
						<Button variant='outline' asChild>
							<a href={lead.googleMapsUri} target='_blank' rel='noreferrer'>
								<MapPin />
								Google Maps
							</a>
						</Button>
					)}
					{lead.photosUri && (
						<Button variant='outline' asChild>
							<a href={lead.photosUri} target='_blank' rel='noreferrer'>
								<Images />
								Fotos
							</a>
						</Button>
					)}
					{lead.reviewsUri && (
						<Button variant='outline' asChild>
							<a href={lead.reviewsUri} target='_blank' rel='noreferrer'>
								<Star />
								Avaliações
							</a>
						</Button>
					)}
					<Button variant='outline' className='col-span-3' asChild>
						<Link to={`/leads/${encodeURIComponent(lead.id)}/venda`}>
							<MessageSquareText />
							{lead.pitch ? 'Abrir plano de venda' : 'Criar plano de venda'}
						</Link>
					</Button>
					{whatsapp && !mobile && (
						<p className='col-span-3 text-xs text-muted-foreground'>
							O telefone parece fixo e pode não ter WhatsApp.
						</p>
					)}
				</div>

				<section>
					<SectionTitle>Informações</SectionTitle>
					<dl className='divide-y rounded-lg border'>
						<InfoRow icon={MapPin} label='Endereço'>
							{lead.address ?? '—'}
						</InfoRow>
						<InfoRow icon={Phone} label='Telefone'>
							<span className='tabular-nums'>{lead.nationalPhone ?? '—'}</span>
						</InfoRow>
						<InfoRow icon={Star} label='Avaliação'>
							{lead.rating != null
								? `${formatRating(lead.rating)} · ${formatNumber(lead.userRatingCount ?? 0)} avaliações`
								: 'Sem avaliações'}
						</InfoRow>
						<InfoRow icon={Globe} label='Site'>
							{lead.websiteUri ? (
								<a
									href={lead.websiteUri}
									target='_blank'
									rel='noreferrer'
									className='inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline'
								>
									<span className='truncate'>{lead.websiteUri}</span>
									<ExternalLink className='size-3 shrink-0' />
								</a>
							) : (
								'Nenhum site no Google'
							)}
						</InfoRow>
						{lead.priceLevel && PRICE_LEVEL_LABELS[lead.priceLevel] && (
							<InfoRow icon={Wallet} label='Faixa de preço'>
								{PRICE_LEVEL_LABELS[lead.priceLevel]}
							</InfoRow>
						)}
						<InfoRow icon={Clock} label='Horário'>
							{lead.openingHours.length ? (
								<ul className='space-y-0.5'>
									{lead.openingHours.map((line) => (
										<li key={line}>{line}</li>
									))}
								</ul>
							) : (
								'—'
							)}
						</InfoRow>
						<InfoRow icon={CalendarClock} label='No banco'>
							Encontrada em {formatDateTime(lead.firstSeenAt)} · atualizada em {formatDateTime(lead.lastSeenAt)}
						</InfoRow>
					</dl>
				</section>

				<section>
					<SectionTitle>Acompanhamento</SectionTitle>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor='lead-status'>Status</FieldLabel>
							<LeadStatusSelect id='lead-status' value={status} onChange={setStatus} className='w-full' />
						</Field>
						<Field>
							<FieldLabel htmlFor='lead-notes'>Anotações</FieldLabel>
							<Textarea
								id='lead-notes'
								value={notes}
								onChange={(event) => setNotes(event.target.value)}
								placeholder='Ex.: falei com o dono, pediu orçamento para sexta.'
								rows={5}
							/>
						</Field>
					</FieldGroup>
				</section>
			</div>

			<SheetFooter className='flex-row justify-end border-t'>
				<SheetClose asChild>
					<Button variant='outline'>Cancelar</Button>
				</SheetClose>
				<Button onClick={handleSave} disabled={saving}>
					{saving && <Spinner />}
					Salvar
				</Button>
			</SheetFooter>
		</>
	)
}

export default function LeadDetailSheet({ lead, open, onOpenChange, onSaved }: LeadDetailSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg'>
				{lead && <LeadDetail key={lead.id} lead={lead} onSaved={onSaved} onClose={() => onOpenChange(false)} />}
			</SheetContent>
		</Sheet>
	)
}
