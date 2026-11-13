import { Pencil } from 'lucide-react'
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
								<a href={cardImageSrc(card.imageUrl)} target='_blank' rel='noreferrer' className='block overflow-hidden rounded-lg border'>
									<img src={cardImageSrc(card.imageUrl)} alt='' className='w-full object-contain' />
								</a>
							)}
							{card.description ? (
								<PitchMarkdown>{card.description}</PitchMarkdown>
							) : (
								<p className='text-sm text-muted-foreground'>Sem descrição.</p>
							)}
						</div>

						<SheetFooter className='flex-row justify-end border-t'>
							<Button onClick={() => onEdit(card)}>
								<Pencil />
								Editar
							</Button>
						</SheetFooter>
					</>
				)}
			</SheetContent>
		</Sheet>
	)
}
