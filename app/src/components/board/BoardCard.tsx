import type { DragEvent } from 'react'
import { AlignLeft } from 'lucide-react'
import ProjectTag from 'src/components/board/ProjectTag'
import PitchMarkdown from 'src/components/pitch/PitchMarkdown'
import { cardImageSrc } from 'src/lib/board'
import { cn } from 'src/lib/utils'
import type { ProjectCard } from 'src/types'

/** Primeira linha com texto, sem a marcação do markdown. */
const plainText = (markdown: string) =>
	markdown
		.split('\n')
		.map((line) => line.replace(/^\s*([#>]+|[-*+]|\d+\.)\s+/, '').replace(/[*_`~]|\[([^\]]*)\]\([^)]*\)/g, '$1').trim())
		.find(Boolean) ?? ''

interface BoardCardProps {
	card: ProjectCard
	projectName: string
	dragging: boolean
	dropBefore: boolean
	/** Com uma coluna só: imagem à esquerda e a descrição completa ao lado. */
	wide?: boolean
	onOpen: () => void
	onDragStart: (event: DragEvent) => void
	onDragEnd: () => void
	onDragOver: (event: DragEvent) => void
}

export default function BoardCard({ card, projectName, dragging, dropBefore, wide = false, onOpen, onDragStart, onDragEnd, onDragOver }: BoardCardProps) {
	return (
		<div onDragOver={onDragOver} className='relative'>
			{dropBefore && <div className='absolute -top-1.5 right-0 left-0 h-0.5 rounded-full bg-primary' />}
			<div
				role='button'
				tabIndex={0}
				draggable
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				onClick={onOpen}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault()
						onOpen()
					}
				}}
				className={cn(
					'w-full cursor-pointer overflow-hidden rounded-lg border bg-card text-left shadow-xs transition hover:border-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					wide && 'sm:flex',
					dragging && 'opacity-40',
				)}
			>
				{card.imageUrl && (
					<img
						src={cardImageSrc(card.imageUrl)}
						alt=''
						className={cn('aspect-video w-full object-cover', wide && 'sm:w-72 sm:shrink-0 sm:self-start lg:w-96')}
						loading='lazy'
						draggable={false}
					/>
				)}
				<div className={cn('space-y-2 p-3', wide && 'min-w-0 flex-1 sm:p-4')}>
					<ProjectTag leadId={card.leadId} name={projectName} />
					<p className={cn('leading-snug font-medium', wide ? 'text-base' : 'text-sm')}>{card.title}</p>
					{card.description &&
						(wide ? (
							<div className='relative max-h-48 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent)] text-muted-foreground'>
								<PitchMarkdown className='[&_a]:pointer-events-none'>{card.description}</PitchMarkdown>
							</div>
						) : (
							<p className='flex items-center gap-1 text-xs text-muted-foreground'>
								<AlignLeft className='size-3' />
								<span className='line-clamp-1'>{plainText(card.description)}</span>
							</p>
						))}
				</div>
			</div>
		</div>
	)
}
