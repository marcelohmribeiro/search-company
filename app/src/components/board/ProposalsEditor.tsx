import { useRef, useState } from 'react'
import { GripVertical, ImagePlus, X } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { MAX_PROPOSALS, IMAGE_TYPES } from 'src/lib/board'
import { cn } from 'src/lib/utils'

/** Proposta no formulário: já salva (`id`) ou nova (`file`), ainda não enviada. */
export interface ProposalDraft {
	key: string
	id?: number
	file?: File
	/** URL da imagem salva ou object URL do arquivo novo. */
	src: string
	caption: string
}

interface ProposalsEditorProps {
	items: ProposalDraft[]
	onChange: (items: ProposalDraft[]) => void
	onAddFiles: (files: File[]) => void
	onRemove: (item: ProposalDraft) => void
	onFocusZone: () => void
}

export default function ProposalsEditor({ items, onChange, onAddFiles, onRemove, onFocusZone }: ProposalsEditorProps) {
	const fileInput = useRef<HTMLInputElement>(null)
	const [dragKey, setDragKey] = useState<string | null>(null)
	const full = items.length >= MAX_PROPOSALS

	function moveOver(targetKey: string) {
		if (!dragKey || dragKey === targetKey) return
		const from = items.findIndex((item) => item.key === dragKey)
		const to = items.findIndex((item) => item.key === targetKey)
		const next = [...items]
		next.splice(to, 0, ...next.splice(from, 1))
		onChange(next)
	}

	return (
		<div className='space-y-2' onPointerDown={onFocusZone} onFocus={onFocusZone}>
			<div className='flex items-baseline justify-between'>
				<span className='text-sm font-medium'>Propostas</span>
				<span className='text-xs text-muted-foreground tabular-nums'>
					{items.length}/{MAX_PROPOSALS}
				</span>
			</div>
			<div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
				{items.map((item, index) => (
					<div
						key={item.key}
						draggable
						onDragStart={(event) => {
							event.dataTransfer.effectAllowed = 'move'
							setDragKey(item.key)
						}}
						onDragEnd={() => setDragKey(null)}
						onDragOver={(event) => {
							if (!dragKey) return
							event.preventDefault()
							moveOver(item.key)
						}}
						className={cn('group space-y-1.5 rounded-lg border bg-card p-1.5', dragKey === item.key && 'opacity-40')}
					>
						<div className='relative overflow-hidden rounded-md'>
							<img src={item.src} alt='' className='aspect-video w-full object-cover' draggable={false} />
							<span className='absolute top-1 left-1 flex items-center gap-0.5 rounded bg-background/80 px-1 text-[11px] font-medium tabular-nums'>
								<GripVertical className='size-3 cursor-grab' />
								{index + 1}
							</span>
							<Button
								type='button'
								variant='secondary'
								size='icon-sm'
								className='absolute top-1 right-1 size-6'
								aria-label='Remover proposta'
								onClick={() => onRemove(item)}
							>
								<X />
							</Button>
						</div>
						<Input
							value={item.caption}
							onChange={(event) => onChange(items.map((other) => (other.key === item.key ? { ...other, caption: event.target.value } : other)))}
							placeholder='Legenda (opcional)'
							maxLength={300}
							className='h-7 text-xs'
						/>
					</div>
				))}
				{!full && (
					<button
						type='button'
						onClick={() => fileInput.current?.click()}
						onDragOver={(event) => !dragKey && event.preventDefault()}
						onDrop={(event) => {
							event.preventDefault()
							onAddFiles([...event.dataTransfer.files])
						}}
						className='flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-2 text-center text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground'
					>
						<ImagePlus className='size-4' />
						Adicionar propostas
						<span className='text-[11px]'>escolher, soltar ou colar</span>
					</button>
				)}
			</div>
			<input
				ref={fileInput}
				type='file'
				multiple
				accept={IMAGE_TYPES.join(',')}
				className='hidden'
				onChange={(event) => {
					onAddFiles([...(event.target.files ?? [])])
					event.target.value = ''
				}}
			/>
		</div>
	)
}
