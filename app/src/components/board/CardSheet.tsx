import { useState } from 'react'
import { Pencil, Presentation } from 'lucide-react'
import ProposalPresentation from 'src/components/board/ProposalPresentation'
import ProjectTag from 'src/components/board/ProjectTag'
import PitchMarkdown from 'src/components/pitch/PitchMarkdown'
import { Button } from 'src/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from 'src/components/ui/sheet'
import { BOARD_COLUMNS, cardImageSrc } from 'src/lib/board'
import { formatDate } from 'src/lib/format'
import { cn } from 'src/lib/utils'
import type { ProjectCard } from 'src/types'

interface CardSheetProps {
	card: ProjectCard | null
	projectName: string
	onClose: () => void
	onEdit: (card: ProjectCard) => void
}

/** Painel lateral só de leitura do card, com o botão que abre o modal de edição. */
export default function CardSheet({ card, projectName, onClose, onEdit }: CardSheetProps) {
	const [presentAt, setPresentAt] = useState<number | null>(null)
	const column = BOARD_COLUMNS.find((item) => item.value === card?.column)
	return (
		<Sheet open={Boolean(card)} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className='gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl'>
				{card && (
					<>
						<SheetHeader className='space-y-2 border-b pr-12'>
							<div className='flex flex-wrap items-center gap-2'>
								<ProjectTag leadId={card.leadId} name={projectName} />
								{column && (
									<span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
										<span className={cn('size-2 rounded-full', column.dotClassName)} />
										{column.label}
									</span>
								)}
							</div>
							<SheetTitle className='text-lg leading-snug'>{card.title}</SheetTitle>
							<SheetDescription>Atualizado em {formatDate(card.updatedAt)}</SheetDescription>
						</SheetHeader>

						<div className='flex-1 space-y-4 overflow-y-auto p-4'>
							{card.imageUrl && (
								<section className='space-y-1.5'>
									{card.proposals.length > 0 && <h3 className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Atual</h3>}
									<a href={cardImageSrc(card.imageUrl)} target='_blank' rel='noreferrer' className='block overflow-hidden rounded-lg border'>
										<img src={cardImageSrc(card.imageUrl)} alt='' className='w-full object-contain' />
									</a>
								</section>
							)}
							{card.proposals.length > 0 && (
								<section className='space-y-1.5'>
									<h3 className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Propostas · {card.proposals.length}</h3>
									<div className='grid grid-cols-2 gap-2'>
										{card.proposals.map((proposal, index) => (
											<button
												key={proposal.id}
												type='button'
												onClick={() => setPresentAt(index)}
												className='group space-y-1 text-left'
											>
												<img
													src={cardImageSrc(proposal.url)}
													alt={proposal.caption ?? ''}
													className='aspect-video w-full rounded-md border object-cover transition group-hover:border-primary/50'
												/>
												<span className='line-clamp-2 text-xs text-muted-foreground'>
													<span className='font-medium text-foreground tabular-nums'>{index + 1}.</span> {proposal.caption}
												</span>
											</button>
										))}
									</div>
								</section>
							)}
							{card.description ? (
								<PitchMarkdown>{card.description}</PitchMarkdown>
							) : (
								<p className='text-sm text-muted-foreground'>Sem descrição.</p>
							)}
						</div>

						<SheetFooter className='flex-row justify-end border-t'>
							{card.proposals.length > 0 && (
								<Button variant='outline' onClick={() => setPresentAt(0)}>
									<Presentation />
									Apresentar
								</Button>
							)}
							<Button onClick={() => onEdit(card)}>
								<Pencil />
								Editar
							</Button>
						</SheetFooter>
					</>
				)}
			</SheetContent>
			<ProposalPresentation card={presentAt === null ? null : card} startAt={presentAt ?? 0} onClose={() => setPresentAt(null)} />
		</Sheet>
	)
}
