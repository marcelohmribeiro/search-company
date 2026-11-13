import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import ProjectTag from 'src/components/board/ProjectTag'
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
import { BOARD_COLUMNS, IMAGE_MAX_BYTES, IMAGE_TYPES, cardImageSrc } from 'src/lib/board'
import { createCard, deleteCard, deleteCardImage, getErrorMessage, updateCard, uploadCardImage } from 'src/services'
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
	const card = target && 'card' in target ? target.card : null
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [leadId, setLeadId] = useState('')
	const [column, setColumn] = useState<BoardColumn>('BACKLOG')
	const [file, setFile] = useState<File | null>(null)
	const [preview, setPreview] = useState<string | null>(null)
	const [removeImage, setRemoveImage] = useState(false)
	const [previewMarkdown, setPreviewMarkdown] = useState(false)
	const [busy, setBusy] = useState(false)
	const [confirmDelete, setConfirmDelete] = useState(false)
	const fileInput = useRef<HTMLInputElement>(null)

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
	}, [target, card])

	useEffect(() => {
		if (!file) return setPreview(null)
		const url = URL.createObjectURL(file)
		setPreview(url)
		return () => URL.revokeObjectURL(url)
	}, [file])

	const project = projects.find((item) => item.leadId === leadId)
	const imageSrc = preview ?? (!removeImage && card?.imageUrl ? cardImageSrc(card.imageUrl) : null)

	function pickFile(picked: File | undefined) {
		if (!picked) return
		if (!IMAGE_TYPES.includes(picked.type)) return toast.error('Use uma imagem JPG, PNG ou WebP.')
		if (picked.size > IMAGE_MAX_BYTES) return toast.error('A imagem passa de 5 MB.')
		setFile(picked)
		setRemoveImage(false)
	}

	async function save() {
		if (!title.trim() || !leadId) return
		setBusy(true)
		try {
			const text = { title: title.trim(), description: description.trim() ? description : null }
			let saved = card ? await updateCard(card.id, { ...text, column }) : await createCard({ ...text, leadId, column })
			if (file) saved = await uploadCardImage(saved.id, file)
			else if (removeImage && card?.imageUrl) saved = await deleteCardImage(saved.id)
			onSaved(saved)
			onClose()
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
				<DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
					<DialogHeader>
						<DialogTitle>{card ? 'Editar card' : 'Novo card'}</DialogTitle>
						<DialogDescription>{project ? <ProjectTag leadId={project.leadId} name={project.name} /> : 'Escolha o projeto.'}</DialogDescription>
					</DialogHeader>

					<form
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
							<Input id='card-title' value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required autoFocus={!card} />
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

						<div className='space-y-2'>
							<Label>Imagem de capa</Label>
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
									Escolher ou soltar imagem
									<span className='text-xs'>JPG, PNG ou WebP, até 5 MB</span>
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
					</form>

					<DialogFooter className='sm:justify-between'>
						{card ? (
							<Button type='button' variant='ghost' className='text-destructive' onClick={() => setConfirmDelete(true)} disabled={busy}>
								<Trash2 />
								Excluir
							</Button>
						) : (
							<span />
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
						<AlertDialogDescription>“{card?.title}” e a imagem dele serão apagados. Não dá para desfazer.</AlertDialogDescription>
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
