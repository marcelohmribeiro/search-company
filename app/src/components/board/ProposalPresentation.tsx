import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from 'src/components/ui/dialog'
import { cardImageSrc } from 'src/lib/board'
import { cn } from 'src/lib/utils'
import type { ProjectCard } from 'src/types'

interface ProposalPresentationProps {
	card: ProjectCard | null
	startAt: number
	onClose: () => void
}

/** Tela cheia: "Atual" (capa) ao lado de cada proposta, navegando com ← →. */
export default function ProposalPresentation({ card, startAt, onClose }: ProposalPresentationProps) {
	const [index, setIndex] = useState(startAt)
	const proposals = card?.proposals ?? []
	const total = proposals.length
	const proposal = proposals[Math.min(index, total - 1)]

	useEffect(() => setIndex(startAt), [startAt, card?.id])

	useEffect(() => {
		if (!card || total < 2) return
		function onKey(event: KeyboardEvent) {
			if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % total)
			if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + total) % total)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [card, total])

	const go = (step: number) => setIndex((current) => (current + step + total) % total)

	return (
		<Dialog open={Boolean(card && proposal)} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='flex h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-3 bg-background p-4 sm:max-w-[calc(100vw-2rem)] sm:p-6'>
				{card && proposal && (
					<>
						<div className='pr-10'>
							<DialogTitle className='text-lg'>{card.title}</DialogTitle>
							<DialogDescription>
								Proposta {index + 1} de {total}
								{proposal.caption && <span className='text-foreground'> · {proposal.caption}</span>}
							</DialogDescription>
						</div>

						<div className={cn('grid min-h-0 flex-1 gap-3', card.imageUrl && 'md:grid-cols-2')}>
							{card.imageUrl && (
								<figure className='flex min-h-0 flex-col gap-1.5'>
									<figcaption className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Atual</figcaption>
									<img src={cardImageSrc(card.imageUrl)} alt='Atual' className='min-h-0 flex-1 rounded-lg border bg-muted/30 object-contain' />
								</figure>
							)}
							<figure className='flex min-h-0 flex-col gap-1.5'>
								<figcaption className='text-xs font-medium tracking-wide text-primary uppercase'>Proposta {index + 1}</figcaption>
								<img src={cardImageSrc(proposal.url)} alt={proposal.caption ?? `Proposta ${index + 1}`} className='min-h-0 flex-1 rounded-lg border bg-muted/30 object-contain' />
							</figure>
						</div>

						{total > 1 && (
							<div className='flex items-center justify-center gap-3'>
								<Button variant='outline' size='icon-sm' onClick={() => go(-1)} aria-label='Proposta anterior'>
									<ChevronLeft />
								</Button>
								<div className='flex gap-1.5 overflow-x-auto'>
									{proposals.map((item, itemIndex) => (
										<button
											key={item.id}
											type='button'
											onClick={() => setIndex(itemIndex)}
											aria-label={`Ver proposta ${itemIndex + 1}`}
											className={cn('h-10 w-16 shrink-0 overflow-hidden rounded border-2 transition', itemIndex === index ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100')}
										>
											<img src={cardImageSrc(item.url)} alt='' className='size-full object-cover' />
										</button>
									))}
								</div>
								<Button variant='outline' size='icon-sm' onClick={() => go(1)} aria-label='Próxima proposta'>
									<ChevronRight />
								</Button>
							</div>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
