import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import ProjectTag from 'src/components/board/ProjectTag'
import ProposalsEditor from 'src/components/board/ProposalsEditor'
import type { ProposalDraft } from 'src/components/board/ProposalsEditor'
import PitchMarkdown from 'src/components/pitch/PitchMarkdown'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import { Button } from 'src/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { Textarea } from 'src/components/ui/textarea'
import { BOARD_COLUMNS, IMAGE_MAX_BYTES, IMAGE_SOURCE_MAX_BYTES, IMAGE_TYPES, MAX_PROPOSALS, cardImageSrc, compressImage } from 'src/lib/board'
import {
	addProposal,
	createCard,
	deleteCard,
	deleteCardImage,
	deleteProposal,
	getErrorMessage,
	updateCard,
	updateProposal,
	uploadCardImage,
} from 'src/services'
import type { BoardColumn, BoardProject, ProjectCard } from 'src/types'

/** `card` edita um card existente; `draft` cria um novo na coluna dada. */
export type CardDialogTarget = { card: ProjectCard } | { draft: { column: BoardColumn; leadId: string } }

interface CardDialogProps {
	target: CardDialogTarget | null
	projects: BoardProject[]
	onClose: () => void
	onSaved: (card: ProjectCard) => void
	onDeleted: (id: number) => void
}

export default function CardDialog({ target, projects, onClose, onSaved, onDeleted }: CardDialogProps) {
	// Mantém o último alvo durante a animação de fechar, para o título não piscar "Novo card".
	const [shown, setShown] = useState(target)
	if (target && target !== shown) setShown(target)
	const card = shown && 'card' in shown ? shown.card : null
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [leadId, setLeadId] = useState('')
	const [column, setColumn] = useState<BoardColumn>('BACKLOG')
	const [file, setFile] = useState<File | null>(null)
	const [preview, setPreview] = useState<string | null>(null)
	const [removeImage, setRemoveImage] = useState(false)
	const [previewMarkdown, setPreviewMarkdown] = useState(false)
	const [proposals, setProposals] = useState<ProposalDraft[]>([])
	const [removedProposals, setRemovedProposals] = useState<number[]>([])
	/** Para onde vai uma imagem colada: a última área clicada, ou a capa enquanto ela estiver vazia. */
	const [pasteZone, setPasteZone] = useState<'cover' | 'proposals' | null>(null)
	const [busy, setBusy] = useState(false)
	const [confirmDelete, setConfirmDelete] = useState(false)
	const fileInput = useRef<HTMLInputElement>(null)
	const titleInput = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!target) return
		const base = 'card' in target ? target.card : target.draft
		setTitle(card?.title ?? '')
		setDescription(card?.description ?? '')
		setLeadId(base.leadId)
		setColumn(base.column)
		setFile(null)
		setRemoveImage(false)
		setPreviewMarkdown(Boolean(card?.description))
		setProposals(
			(card?.proposals ?? []).map((proposal) => ({
				key: `saved-${proposal.id}`,
				id: proposal.id,
				src: cardImageSrc(proposal.url),
				caption: proposal.caption ?? '',
			})),
		)
		setRemovedProposals([])
		setPasteZone(null)
	}, [target, card])

	useEffect(() => {
		if (!file) return setPreview(null)
		const url = URL.createObjectURL(file)
		setPreview(url)
		return () => URL.revokeObjectURL(url)
	}, [file])

	const project = projects.find((item) => item.leadId === leadId)
	const imageSrc = preview ?? (!removeImage && card?.imageUrl ? cardImageSrc(card.imageUrl) : null)

	/** Valida e comprime no navegador; `null` (com aviso) se a imagem não serve. */
	async function prepareImage(picked: File) {
		if (!IMAGE_TYPES.includes(picked.type)) return toast.error('Use uma imagem JPG, PNG ou WebP.'), null
		if (picked.size > IMAGE_SOURCE_MAX_BYTES) return toast.error('A imagem passa de 25 MB.'), null
		const compressed = await compressImage(picked).catch(() => picked)
		if (compressed.size > IMAGE_MAX_BYTES) return toast.error('A imagem passa de 5 MB mesmo comprimida.'), null
		return compressed
	}

	async function pickFile(picked: File | undefined) {
		if (!picked) return
		const compressed = await prepareImage(picked)
		if (!compressed) return
		setFile(compressed)
		setRemoveImage(false)
	}

	async function addProposalFiles(files: File[]) {
		const room = MAX_PROPOSALS - proposals.length
		if (files.length > room) toast.error(`Cada card aceita até ${MAX_PROPOSALS} propostas.`)
		const prepared = (await Promise.all(files.slice(0, Math.max(room, 0)).map(prepareImage))).filter((item): item is File => Boolean(item))
		setProposals((current) => [
			...current,
			...prepared.map((item) => ({ key: crypto.randomUUID(), file: item, src: URL.createObjectURL(item), caption: '' })),
		])
	}

	function removeProposal(item: ProposalDraft) {
		if (item.id) setRemovedProposals((current) => [...current, item.id!])
		if (item.file) URL.revokeObjectURL(item.src)
		setProposals((current) => current.filter((other) => other.key !== item.key))
	}

	/** Envia as mudanças das propostas: remoções, novas e depois ordem e legendas. */
	async function saveProposals(saved: ProjectCard) {
		for (const id of removedProposals) saved = await deleteProposal(saved.id, id)
		const ids = new Map<string, number>()
		for (const item of proposals) {
			if (!item.file) continue
			const before = new Set(saved.proposals.map((proposal) => proposal.id))
			saved = await addProposal(saved.id, item.file, item.caption.trim() || null)
			const created = saved.proposals.find((proposal) => !before.has(proposal.id))
			if (created) ids.set(item.key, created.id)
		}
		for (const [index, item] of proposals.entries()) {
			const id = item.id ?? ids.get(item.key)
			const current = saved.proposals.find((proposal) => proposal.id === id)
			if (!id || !current) continue
			const caption = item.caption.trim() || null
			if (current.position !== index + 1 || current.caption !== caption) {
				saved = await updateProposal(saved.id, id, { position: index + 1, caption })
			}
		}
		return saved
	}

	// Colar (Ctrl/Cmd+V) uma imagem no modal vai para a capa ou para as propostas (ver `pasteZone`). Texto colado segue normal.
	useEffect(() => {
		if (!target) return
		function onPaste(event: ClipboardEvent) {
			const images = [...(event.clipboardData?.files ?? [])].filter((item) => item.type.startsWith('image/'))
			if (!images.length) return
			event.preventDefault()
			if ((pasteZone ?? (imageSrc ? 'proposals' : 'cover')) === 'proposals') addProposalFiles(images)
			else pickFile(images[0])
		}
		window.addEventListener('paste', onPaste)
		return () => window.removeEventListener('paste', onPaste)
	})

	/** `keepOpen` (Ctrl/Cmd+Enter num card novo) salva e limpa o formulário para o próximo, no mesmo projeto e coluna. */
	async function save(keepOpen = false) {
		if (!title.trim() || !leadId) return
		setBusy(true)
		try {
			const text = { title: title.trim(), description: description.trim() ? description : null }
			let saved = card ? await updateCard(card.id, { ...text, column }) : await createCard({ ...text, leadId, column })
			if (file) saved = await uploadCardImage(saved.id, file)
			else if (removeImage && card?.imageUrl) saved = await deleteCardImage(saved.id)
			saved = await saveProposals(saved)
			onSaved(saved)
			if (keepOpen && !card) {
				setTitle('')
				setDescription('')
				setFile(null)
				setRemoveImage(false)
				setPreviewMarkdown(false)
				setProposals([])
				setPasteZone(null)
				toast.success(`“${saved.title}” adicionado.`)
				titleInput.current?.focus()
			} else onClose()
		} catch (error) {
			toast.error('Não foi possível salvar o card.', { description: getErrorMessage(error) })
		} finally {
			setBusy(false)
		}
	}

	async function remove() {
		if (!card) return
		setBusy(true)
		try {
			await deleteCard(card.id)
			onDeleted(card.id)
			setConfirmDelete(false)
			onClose()
		} catch (error) {
			toast.error('Não foi possível excluir o card.', { description: getErrorMessage(error) })
		} finally {
			setBusy(false)
		}
	}

	return (
		<>
			<Dialog open={Boolean(target)} onOpenChange={(open) => !open && !busy && onClose()}>
				<DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
					<DialogHeader>
						<DialogTitle>{card ? 'Editar card' : 'Novo card'}</DialogTitle>
						<DialogDescription>{project ? <ProjectTag leadId={project.leadId} name={project.name} /> : 'Escolha o projeto.'}</DialogDescription>
					</DialogHeader>

					<form
						onKeyDown={(event) => {
							if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
								event.preventDefault()
								if (!busy) save(true)
							}
						}}
						id='card-form'
						className='space-y-4'
						onSubmit={(event) => {
							event.preventDefault()
							save()
						}}
					>
						<div className='grid gap-4 sm:grid-cols-2'>
							<div className='space-y-2'>
								<Label>Projeto</Label>
								<Select value={leadId} onValueChange={setLeadId} disabled={Boolean(card)}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Escolha o projeto' />
									</SelectTrigger>
									<SelectContent>
										{projects.map((item) => (
											<SelectItem key={item.leadId} value={item.leadId}>
												{item.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-2'>
								<Label>Coluna</Label>
								<Select value={column} onValueChange={(value) => setColumn(value as BoardColumn)}>
									<SelectTrigger className='w-full'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{BOARD_COLUMNS.map((item) => (
											<SelectItem key={item.value} value={item.value}>
												{item.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='card-title'>Título</Label>
							<Input ref={titleInput} id='card-title' value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required autoFocus={!card} />
						</div>

						<div className='space-y-2'>
							<div className='flex items-center justify-between'>
								<Label htmlFor='card-description'>Descrição</Label>
								{description.trim() && (
									<Button type='button' variant='ghost' size='sm' onClick={() => setPreviewMarkdown((value) => !value)}>
										{previewMarkdown ? 'Editar' : 'Visualizar'}
									</Button>
								)}
							</div>
							{previewMarkdown && description.trim() ? (
								<div className='rounded-md border p-3'>
									<PitchMarkdown>{description}</PitchMarkdown>
								</div>
							) : (
								<Textarea
									id='card-description'
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									rows={5}
									placeholder='Aceita markdown: listas, **negrito**, links…'
								/>
							)}
						</div>

						<div className='space-y-2' onPointerDown={() => setPasteZone('cover')}>
							<Label>Atual (capa)</Label>
							{imageSrc ? (
								<div className='relative overflow-hidden rounded-lg border'>
									<img src={imageSrc} alt='' className='aspect-video w-full object-cover' />
									<Button
										type='button'
										variant='secondary'
										size='icon-sm'
										className='absolute top-2 right-2'
										aria-label='Remover imagem'
										onClick={() => {
											setFile(null)
											setRemoveImage(true)
										}}
									>
										<X />
									</Button>
								</div>
							) : (
								<button
									type='button'
									onClick={() => fileInput.current?.click()}
									onDragOver={(event) => event.preventDefault()}
									onDrop={(event) => {
										event.preventDefault()
										pickFile(event.dataTransfer.files[0])
									}}
									className='flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed p-6 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground'
								>
									<ImagePlus className='size-5' />
									Escolher, soltar ou colar (Ctrl/⌘+V)
									<span className='text-xs'>JPG, PNG ou WebP; reduzida antes do envio</span>
								</button>
							)}
							<input
								ref={fileInput}
								type='file'
								accept={IMAGE_TYPES.join(',')}
								className='hidden'
								onChange={(event) => {
									pickFile(event.target.files?.[0])
									event.target.value = ''
								}}
							/>
						</div>

						<ProposalsEditor
							items={proposals}
							onChange={setProposals}
							onAddFiles={addProposalFiles}
							onRemove={removeProposal}
							onFocusZone={() => setPasteZone('proposals')}
						/>
					</form>

					<DialogFooter className='sm:justify-between'>
						{card ? (
							<Button type='button' variant='ghost' className='text-destructive' onClick={() => setConfirmDelete(true)} disabled={busy}>
								<Trash2 />
								Excluir
							</Button>
						) : (
							<p className='hidden self-center text-xs text-muted-foreground sm:block'>
								<kbd className='rounded border bg-muted px-1 font-sans'>Ctrl/⌘ + Enter</kbd> salva e abre o próximo
							</p>
						)}
						<div className='flex gap-2'>
							<Button type='button' variant='outline' onClick={onClose} disabled={busy}>
								Cancelar
							</Button>
							<Button type='submit' form='card-form' disabled={busy || !title.trim() || !leadId}>
								{busy ? 'Salvando…' : 'Salvar'}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir este card?</AlertDialogTitle>
						<AlertDialogDescription>“{card?.title}” e as imagens dele serão apagados. Não dá para desfazer.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={remove} disabled={busy} className='bg-destructive text-white hover:bg-destructive/90'>
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
