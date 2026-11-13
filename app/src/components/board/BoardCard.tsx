import type { DragEvent } from 'react'
import { AlignLeft } from 'lucide-react'
import ProjectTag from 'src/components/board/ProjectTag'
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
	onOpen: () => void
	onDragStart: (event: DragEvent) => void
	onDragEnd: () => void
	onDragOver: (event: DragEvent) => void
}

export default function BoardCard({ card, projectName, dragging, dropBefore, onOpen, onDragStart, onDragEnd, onDragOver }: BoardCardProps) {
	return (
		<div onDragOver={onDragOver} className='relative'>
			{dropBefore && <div className='absolute -top-1.5 right-0 left-0 h-0.5 rounded-full bg-primary' />}
			<button
				type='button'
				draggable
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				onClick={onOpen}
				className={cn(
					'w-full overflow-hidden rounded-lg border bg-card text-left shadow-xs transition hover:border-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					dragging && 'opacity-40',
				)}
			>
				{card.imageUrl && <img src={cardImageSrc(card.imageUrl)} alt='' className='aspect-video w-full object-cover' loading='lazy' draggable={false} />}
				<div className='space-y-2 p-3'>
					<ProjectTag leadId={card.leadId} name={projectName} />
					<p className='text-sm leading-snug font-medium'>{card.title}</p>
					{card.description && (
						<p className='flex items-center gap-1 text-xs text-muted-foreground'>
							<AlignLeft className='size-3' />
							<span className='line-clamp-1'>{plainText(card.description)}</span>
						</p>
					)}
				</div>
			</button>
		</div>
	)
}
