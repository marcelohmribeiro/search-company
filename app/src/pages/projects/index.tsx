import { useCallback, useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { ChevronDown, FolderKanban, LayoutGrid, Plus, Rows3 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import PageHeader from 'src/components/PageHeader'
import BoardCard from 'src/components/board/BoardCard'
import CardDialog from 'src/components/board/CardDialog'
import type { CardDialogTarget } from 'src/components/board/CardDialog'
import ProjectTag from 'src/components/board/ProjectTag'
import { Alert, AlertDescription } from 'src/components/ui/alert'
import { Button } from 'src/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Skeleton } from 'src/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from 'src/components/ui/toggle-group'
import { useApi } from 'src/hooks'
import { BOARD_COLUMNS, dropPosition } from 'src/lib/board'
import { cn } from 'src/lib/utils'
import { fetchBoard, getErrorMessage, updateCard } from 'src/services'
import type { BoardColumn, ProjectCard } from 'src/types'

const GRID_COLUMNS: Record<number, string> = { 1: '', 2: 'md:grid-cols-2', 3: 'md:grid-cols-2 xl:grid-cols-3', 4: 'md:grid-cols-2 xl:grid-cols-4' }

type DropTarget = { column: BoardColumn; beforeId: number | null }

export default function ProjectsPage() {
	const board = useApi(fetchBoard)
	const [params, setParams] = useSearchParams()
	const [dialog, setDialog] = useState<CardDialogTarget | null>(null)
	const [draggingId, setDraggingId] = useState<number | null>(null)
	const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

	const projects = useMemo(() => board.data?.projects ?? [], [board.data])
	const cards = useMemo(() => board.data?.cards ?? [], [board.data])
	const names = useMemo(() => new Map(projects.map((project) => [project.leadId, project.name])), [projects])

	const selectedProjects = params.getAll('projeto').filter((id) => names.has(id) || !board.data)
	const selectedColumns = params.getAll('coluna') as BoardColumn[]
	const visibleColumns = selectedColumns.length ? BOARD_COLUMNS.filter((column) => selectedColumns.includes(column.value)) : BOARD_COLUMNS

	// Com até 2 colunas visíveis, os cards podem ficar em lista (horizontais com 1 coluna) ou em grade.
	const fewColumns = visibleColumns.length <= 2
	const gridView = fewColumns && params.get('visao') === 'grade'
	const wideCards = visibleColumns.length === 1 && !gridView
	const cardsLayout = !gridView
		? 'flex flex-col gap-3'
		: visibleColumns.length === 1
			? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
			: 'grid gap-3 lg:grid-cols-2'

	const setFilter = useCallback(
		(key: 'projeto' | 'coluna' | 'visao', values: string[]) =>
			setParams(
				(current) => {
					const next = new URLSearchParams(current)
					next.delete(key)
					values.forEach((value) => next.append(key, value))
					return next
				},
				{ replace: true },
			),
		[setParams],
	)

	const columnCards = (column: BoardColumn) =>
		cards
			.filter((card) => card.column === column && (!selectedProjects.length || selectedProjects.includes(card.leadId)))
			.sort((a, b) => a.position - b.position)

	const replaceCard = (saved: ProjectCard) =>
		board.setData((current) => current && { ...current, cards: [...current.cards.filter((card) => card.id !== saved.id), saved] })

	function openDraft(column: BoardColumn) {
		const leadId = selectedProjects.length === 1 ? selectedProjects[0] : (projects[0]?.leadId ?? '')
		setDialog({ draft: { column, leadId } })
	}

	function onDragOverColumn(event: DragEvent, column: BoardColumn) {
		if (draggingId === null) return
		event.preventDefault()
		if (event.target === event.currentTarget) setDropTarget({ column, beforeId: null })
	}

	function onDragOverCard(event: DragEvent, column: BoardColumn, card: ProjectCard) {
		if (draggingId === null) return
		event.preventDefault()
		event.stopPropagation()
		const rect = event.currentTarget.getBoundingClientRect()
		const list = columnCards(column)
		const below = event.clientY > rect.top + rect.height / 2
		const beforeId = below ? (list[list.findIndex((item) => item.id === card.id) + 1]?.id ?? null) : card.id
		setDropTarget({ column, beforeId })
	}

	async function onDrop(event: DragEvent) {
		event.preventDefault()
		const card = cards.find((item) => item.id === draggingId)
		const target = dropTarget
		setDraggingId(null)
		setDropTarget(null)
		if (!card || !target || target.beforeId === card.id) return
		const position = dropPosition(columnCards(target.column), card.id, target.beforeId)
		const previous = card
		replaceCard({ ...card, column: target.column, position })
		try {
			replaceCard(await updateCard(card.id, { column: target.column, position }))
		} catch (error) {
			replaceCard(previous)
			toast.error('Não foi possível mover o card.', { description: getErrorMessage(error) })
		}
	}

	const projectLabel =
		selectedProjects.length === 0 ? 'Todos os projetos' : selectedProjects.length === 1 ? names.get(selectedProjects[0]) : `${selectedProjects.length} projetos`

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Projetos'
				description='Cada lead fechado vira um projeto. Arraste os cards entre as colunas.'
				actions={
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' size='sm' disabled={!projects.length}>
									{projectLabel}
									<ChevronDown />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='max-h-80 w-64'>
								{projects.map((project) => (
									<DropdownMenuCheckboxItem
										key={project.leadId}
										checked={selectedProjects.includes(project.leadId)}
										onSelect={(event) => event.preventDefault()}
										onCheckedChange={(checked) =>
											setFilter(
												'projeto',
												checked ? [...selectedProjects, project.leadId] : selectedProjects.filter((id) => id !== project.leadId),
											)
										}
									>
										<ProjectTag leadId={project.leadId} name={project.name} />
									</DropdownMenuCheckboxItem>
								))}
								{selectedProjects.length > 0 && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem onSelect={() => setFilter('projeto', [])}>Mostrar todos</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
						{fewColumns && (
							<ToggleGroup
								type='single'
								variant='outline'
								size='sm'
								value={gridView ? 'grade' : 'lista'}
								onValueChange={(value) => value && setFilter('visao', value === 'grade' ? ['grade'] : [])}
							>
								<ToggleGroupItem value='lista' aria-label='Ver em lista' className='px-2.5'>
									<Rows3 />
								</ToggleGroupItem>
								<ToggleGroupItem value='grade' aria-label='Ver em grade' className='px-2.5'>
									<LayoutGrid />
								</ToggleGroupItem>
							</ToggleGroup>
						)}
						<ToggleGroup type='multiple' variant='outline' size='sm' value={selectedColumns} onValueChange={(values) => setFilter('coluna', values)}>
							{BOARD_COLUMNS.map((column) => (
								<ToggleGroupItem key={column.value} value={column.value} className='px-3'>
									{column.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</>
				}
			/>

			{board.error && (
				<Alert variant='destructive'>
					<AlertDescription>{board.error}</AlertDescription>
				</Alert>
			)}

			{board.loading && !board.data ? (
				<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
					{BOARD_COLUMNS.map((column) => (
						<Skeleton key={column.value} className='h-72 rounded-xl' />
					))}
				</div>
			) : board.data && !projects.length ? (
				<Empty className='border bg-background'>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<FolderKanban />
						</EmptyMedia>
						<EmptyTitle>Nenhum projeto ainda</EmptyTitle>
						<EmptyDescription>Quando um lead estiver como “Fechado”, ele aparece aqui como projeto.</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant='outline' size='sm' asChild>
							<Link to='/leads?status=CLOSED'>Ver leads fechados</Link>
						</Button>
					</EmptyContent>
				</Empty>
			) : (
				board.data && (
					<div className={cn('grid gap-4', GRID_COLUMNS[visibleColumns.length])}>
						{visibleColumns.map((column) => {
							const list = columnCards(column.value)
							const isTarget = dropTarget?.column === column.value
							return (
								<section
									key={column.value}
									onDragOver={(event) => onDragOverColumn(event, column.value)}
									onDrop={onDrop}
									className={cn('flex min-h-72 flex-col gap-3 rounded-xl border bg-muted/50 p-3 transition-colors', isTarget && 'border-primary/40 bg-primary/5')}
								>
									<header className='flex items-center justify-between px-1'>
										<h2 className='flex items-center gap-2 text-sm font-medium'>
											<span className={cn('size-2 rounded-full', column.dotClassName)} />
											{column.label}
											<span className='text-muted-foreground tabular-nums'>{list.length}</span>
										</h2>
										<Button variant='ghost' size='icon-sm' aria-label={`Novo card em ${column.label}`} onClick={() => openDraft(column.value)}>
											<Plus />
										</Button>
									</header>
									<div className={cardsLayout}>
										{list.map((card) => (
										<BoardCard
											key={card.id}
											card={card}
											projectName={names.get(card.leadId) ?? ''}
											wide={wideCards}
											dragging={draggingId === card.id}
											dropBefore={isTarget && dropTarget?.beforeId === card.id && draggingId !== card.id}
											onOpen={() => setDialog({ card })}
											onDragStart={(event) => {
												event.dataTransfer.effectAllowed = 'move'
												setDraggingId(card.id)
											}}
											onDragEnd={() => {
												setDraggingId(null)
												setDropTarget(null)
											}}
											onDragOver={(event) => onDragOverCard(event, column.value, card)}
										/>
									))}
									</div>
									{isTarget && dropTarget?.beforeId === null && <div className='h-0.5 rounded-full bg-primary' />}
									<div className='flex-1' onDragOver={(event) => onDragOverColumn(event, column.value)} />
								</section>
							)
						})}
					</div>
				)
			)}

			<CardDialog
				target={dialog}
				projects={projects}
				onClose={() => setDialog(null)}
				onSaved={replaceCard}
				onDeleted={(id) => board.setData((current) => current && { ...current, cards: current.cards.filter((card) => card.id !== id) })}
			/>
		</div>
	)
}
