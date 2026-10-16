import { useState } from 'react'
import SiteStatusBadge from 'src/components/SiteStatusBadge'
import { LEAD_STATUS_OPTIONS, businessStatusLabel } from 'src/constants/labels'
import { isBrazilianMobile, whatsappUrl } from 'src/lib/phone'
import { getErrorMessage, updateLead } from 'src/services'
import type { Lead, LeadStatus } from 'src/types'

const PRICE_LEVEL_LABELS: Record<string, string> = {
	PRICE_LEVEL_INEXPENSIVE: '$ (barato)',
	PRICE_LEVEL_MODERATE: '$$ (moderado)',
	PRICE_LEVEL_EXPENSIVE: '$$$ (caro)',
	PRICE_LEVEL_VERY_EXPENSIVE: '$$$$ (muito caro)',
}

interface LeadDetailModalProps {
	lead: Lead
	onClose: () => void
	onSaved: (lead: Lead) => void
}

export default function LeadDetailModal({ lead, onClose, onSaved }: LeadDetailModalProps) {
	const [status, setStatus] = useState<LeadStatus>(lead.status)
	const [notes, setNotes] = useState(lead.notes ?? '')
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const whatsapp = whatsappUrl(lead.internationalPhone)

	async function handleSave() {
		setSaving(true)
		setError(null)
		try {
			onSaved(await updateLead(lead.id, { status, notes }))
			onClose()
		} catch (saveError) {
			setError(getErrorMessage(saveError))
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className='fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4' onClick={onClose}>
			<div
				className='max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-lg bg-white p-5 shadow-xl'
				onClick={(event) => event.stopPropagation()}
			>
				<div className='flex items-start justify-between gap-4'>
					<div>
						<h2 className='text-lg font-semibold'>{lead.name}</h2>
						<p className='text-sm text-zinc-500'>
							{[
								lead.primaryTypeName ?? lead.category,
								lead.neighborhood ?? lead.searchNeighborhood,
								lead.state ? `${lead.city}/${lead.state}` : lead.city,
							]
								.filter(Boolean)
								.join(' · ')}
						</p>
					</div>
					<button onClick={onClose} className='text-2xl leading-none text-zinc-400 hover:text-zinc-700' aria-label='Fechar'>
						×
					</button>
				</div>

				<dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
					<dt className='text-zinc-500'>Funcionamento</dt>
					<dd>{businessStatusLabel(lead.businessStatus) ?? '—'}</dd>
					<dt className='text-zinc-500'>Endereço</dt>
					<dd>
						{lead.address ?? '—'}
						{lead.pureServiceArea && (
							<span className='mt-1 block text-xs text-amber-700'>Atende no local do cliente, sem endereço físico no Maps</span>
						)}
					</dd>
					<dt className='text-zinc-500'>Telefone</dt>
					<dd>{lead.nationalPhone ?? '—'}</dd>
					<dt className='text-zinc-500'>Nota</dt>
					<dd>{lead.rating != null ? `${lead.rating.toFixed(1)} (${lead.userRatingCount ?? 0} avaliações)` : 'Sem avaliações'}</dd>
					<dt className='text-zinc-500'>Site</dt>
					<dd className='space-y-1'>
						<SiteStatusBadge status={lead.siteStatus} />
						{lead.websiteUri && (
							<a href={lead.websiteUri} target='_blank' rel='noreferrer' className='block break-all text-blue-700 underline'>
								{lead.websiteUri}
							</a>
						)}
					</dd>
					{PRICE_LEVEL_LABELS[lead.priceLevel ?? ''] && (
						<>
							<dt className='text-zinc-500'>Preço</dt>
							<dd>{PRICE_LEVEL_LABELS[lead.priceLevel ?? '']}</dd>
						</>
					)}
					<dt className='text-zinc-500'>Horário</dt>
					<dd>
						{lead.openingHours.length ? (
							<ul>
								{lead.openingHours.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						) : (
							'—'
						)}
					</dd>
				</dl>

				<div className='flex flex-wrap gap-2'>
					{lead.googleMapsUri && (
						<a href={lead.googleMapsUri} target='_blank' rel='noreferrer' className='rounded-md border border-zinc-300 px-3 py-1.5 text-sm'>
							Abrir no Google Maps
						</a>
					)}
					{lead.photosUri && (
						<a href={lead.photosUri} target='_blank' rel='noreferrer' className='rounded-md border border-zinc-300 px-3 py-1.5 text-sm'>
							Fotos
						</a>
					)}
					{lead.reviewsUri && (
						<a href={lead.reviewsUri} target='_blank' rel='noreferrer' className='rounded-md border border-zinc-300 px-3 py-1.5 text-sm'>
							Avaliações
						</a>
					)}
					{whatsapp && (
						<a
							href={whatsapp}
							target='_blank'
							rel='noreferrer'
							className='rounded-md bg-green-600 px-3 py-1.5 text-sm text-white'
							title={isBrazilianMobile(lead.internationalPhone) ? undefined : 'Telefone fixo: pode não ter WhatsApp'}
						>
							Conversar no WhatsApp{isBrazilianMobile(lead.internationalPhone) ? '' : ' (fixo)'}
						</a>
					)}
				</div>

				<label className='block space-y-1'>
					<span className='text-sm font-medium'>Status</span>
					<select
						value={status}
						onChange={(event) => setStatus(event.target.value as LeadStatus)}
						className='w-full rounded-md border border-zinc-300 px-3 py-2'
					>
						{LEAD_STATUS_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>

				<label className='block space-y-1'>
					<span className='text-sm font-medium'>Anotações</span>
					<textarea
						value={notes}
						onChange={(event) => setNotes(event.target.value)}
						rows={5}
						className='w-full rounded-md border border-zinc-300 px-3 py-2'
					/>
				</label>

				{error && <p className='text-sm text-red-700'>{error}</p>}

				<div className='flex justify-end gap-2'>
					<button onClick={onClose} className='rounded-md border border-zinc-300 px-4 py-2'>
						Cancelar
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						className='rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-40'
					>
						{saving ? 'Salvando…' : 'Salvar'}
					</button>
				</div>
			</div>
		</div>
	)
}
