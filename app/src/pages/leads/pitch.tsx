import { useCallback, useState } from 'react'
import { ArrowLeft, CircleAlert, FileText, ListChecks, MessageSquareText, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import PageHeader from 'src/components/PageHeader'
import PitchBlockCard from 'src/components/pitch/PitchBlockCard'
import PitchHeaderCard from 'src/components/pitch/PitchHeaderCard'
import SellerNameDialog from 'src/components/pitch/SellerNameDialog'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
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
import { Card } from 'src/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'src/components/ui/empty'
import { Skeleton } from 'src/components/ui/skeleton'
import { useApi } from 'src/hooks'
import { formatDate } from 'src/lib/format'
import { contactWhatsappUrl, fillSeller, hasSellerPlaceholder, messageDueAt, newBlock, whatsappWithText } from 'src/lib/pitch'
import {
	deletePitch,
	fetchLead,
	fetchPitch,
	getErrorMessage,
	savePitch,
	setPitchItemDone,
	setPitchMessageSent,
	updateMe,
} from 'src/services'
import { useAuthStore } from 'src/store/authStore'
import type { Pitch, PitchBlock, PitchChecklistBlock, PitchHeader, PitchMessageBlock } from 'src/types'

const EMPTY_HEADER: PitchHeader = { demoUrl: null, decisionMaker: null, contactWhatsapp: null, contactNotes: null }

const ADD_BLOCK_OPTIONS = [
	{ type: 'message', label: 'Mensagem', icon: MessageSquareText },
	{ type: 'markdown', label: 'Texto', icon: FileText },
	{ type: 'checklist', label: 'Checklist', icon: ListChecks },
] as const

const headerOf = ({ demoUrl, decisionMaker, contactWhatsapp, contactNotes }: PitchHeader): PitchHeader => ({
	demoUrl,
	decisionMaker,
	contactWhatsapp,
	contactNotes,
})

export default function LeadPitchPage() {
	const { id = '' } = useParams()
	const loadLead = useCallback(() => fetchLead(id), [id])
	const loadPitch = useCallback(() => fetchPitch(id), [id])
	const lead = useApi(loadLead)
	const pitchState = useApi(loadPitch)
	const pitch = pitchState.data
	const setPitch = pitchState.setData
	const { user, setUser } = useAuthStore()

	const [busy, setBusy] = useState(false)
	const [confirmDelete, setConfirmDelete] = useState(false)
	const [pendingCopy, setPendingCopy] = useState<{ block: PitchMessageBlock; openWhatsapp: boolean } | null>(null)

	const run = useCallback(
		async (action: () => Promise<Pitch>, failure: string) => {
			setBusy(true)
			try {
				const saved = await action()
				setPitch(() => saved)
				return true
			} catch (error) {
				toast.error(failure, { description: getErrorMessage(error) })
				return false
			} finally {
				setBusy(false)
			}
		},
		[setPitch],
	)

	const save = (header: PitchHeader, blocks: PitchBlock[]) =>
		run(() => savePitch(id, { ...header, blocks }), 'Não foi possível salvar o plano')

	if (lead.error || pitchState.error) {
		return (
			<Alert variant='destructive'>
				<CircleAlert />
				<AlertTitle>Não foi possível carregar o plano de venda</AlertTitle>
				<AlertDescription>{lead.error ?? pitchState.error}</AlertDescription>
			</Alert>
		)
	}

	if (!lead.data || pitchState.loading) {
		return (
			<div className='space-y-4'>
				<Skeleton className='h-8 w-64' />
				<Skeleton className='h-40 w-full' />
				<Skeleton className='h-60 w-full' />
			</div>
		)
	}

	const company = lead.data
	const whatsapp = contactWhatsappUrl(pitch?.contactWhatsapp ?? null, company)
	const back = (
		<Button variant='outline' asChild>
			<Link to='/leads'>
				<ArrowLeft />
				Leads
			</Link>
		</Button>
	)

	if (!pitch) {
		return (
			<div className='space-y-6'>
				<PageHeader title={company.name} description='Plano de venda do site' actions={back} />
				<Card>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<MessageSquareText />
							</EmptyMedia>
							<EmptyTitle>Nenhum plano de venda</EmptyTitle>
							<EmptyDescription>
								Crie aqui ou peça ao Claude: a skill landing-page envia o plano direto para esta página.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button
								onClick={() =>
									save(EMPTY_HEADER, [{ ...(newBlock('message') as PitchMessageBlock), label: 'Mensagem 1', group: 'main', dayOffset: 0 }])
								}
								disabled={busy}
							>
								<Plus />
								Criar plano
							</Button>
						</EmptyContent>
					</Empty>
				</Card>
			</div>
		)
	}

	const header = headerOf(pitch)
	const blocks = pitch.blocks

	const replaceBlock = (block: PitchBlock) => save(header, blocks.map((item) => (item.id === block.id ? block : item)))

	function moveBlock(index: number, direction: -1 | 1) {
		const next = [...blocks]
		;[next[index], next[index + direction]] = [next[index + direction], next[index]]
		save(header, next)
	}

	function copyMessage(block: PitchMessageBlock, openWhatsapp: boolean, displayName = user?.displayName) {
		const text = fillSeller(block.body, displayName)
		const target = openWhatsapp && whatsapp ? whatsappWithText(whatsapp, text) : null
		const popup = target ? window.open('', '_blank') : null
		navigator.clipboard
			.writeText(text)
			.then(() => toast.success('Mensagem copiada'))
			.catch(() => toast.error('Não foi possível copiar a mensagem'))
		if (popup && target) popup.location.href = target
		if (openWhatsapp && !whatsapp) toast.error('Sem WhatsApp para esta empresa')
		if (openWhatsapp && !block.sentAt) run(() => setPitchMessageSent(id, block.id, true), 'Não foi possível marcar como enviada')
	}

	function requestCopy(block: PitchMessageBlock, openWhatsapp: boolean) {
		if (hasSellerPlaceholder(block.body) && !user?.displayName) setPendingCopy({ block, openWhatsapp })
		else copyMessage(block, openWhatsapp)
	}

	async function saveSellerName(name: string) {
		try {
			const updated = await updateMe({ displayName: name })
			setUser(updated)
			if (pendingCopy) copyMessage(pendingCopy.block, pendingCopy.openWhatsapp, updated.displayName)
			setPendingCopy(null)
		} catch (error) {
			toast.error('Não foi possível salvar o nome', { description: getErrorMessage(error) })
		}
	}

	async function handleDelete() {
		setBusy(true)
		try {
			await deletePitch(id)
			setPitch(() => null)
			toast.success('Plano apagado')
		} catch (error) {
			toast.error('Não foi possível apagar o plano', { description: getErrorMessage(error) })
		} finally {
			setBusy(false)
			setConfirmDelete(false)
		}
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title={company.name}
				description={
					pitch.nextFollowUpAt
						? `Plano de venda · próximo follow-up em ${formatDate(pitch.nextFollowUpAt)}`
						: 'Plano de venda do site'
				}
				actions={back}
			/>

			<PitchHeaderCard
				header={header}
				whatsapp={whatsapp}
				busy={busy}
				onSave={(next) => save(next, blocks)}
				onDelete={() => setConfirmDelete(true)}
			/>

			{blocks.map((block, index) => (
				<PitchBlockCard
					key={block.id}
					block={block}
					dueAt={block.type === 'message' ? messageDueAt(blocks, block.dayOffset) : null}
					displayName={user?.displayName}
					isFirst={index === 0}
					isLast={index === blocks.length - 1}
					busy={busy}
					onSave={replaceBlock}
					onMove={(direction) => moveBlock(index, direction)}
					onRemove={() => save(header, blocks.filter((item) => item.id !== block.id))}
					onCopy={requestCopy}
					onToggleSent={(message) =>
						run(() => setPitchMessageSent(id, message.id, !message.sentAt), 'Não foi possível atualizar o envio')
					}
					onToggleItem={(list: PitchChecklistBlock, itemId, done) =>
						run(() => setPitchItemDone(id, list.id, itemId, done), 'Não foi possível atualizar o item')
					}
				/>
			))}

			<div className='flex flex-wrap items-center gap-2'>
				<span className='text-sm text-muted-foreground'>Adicionar bloco:</span>
				{ADD_BLOCK_OPTIONS.map(({ type, label, icon: Icon }) => (
					<Button key={type} variant='outline' size='sm' onClick={() => save(header, [...blocks, newBlock(type)])} disabled={busy}>
						<Icon />
						{label}
					</Button>
				))}
			</div>

			<SellerNameDialog
				open={pendingCopy !== null}
				onOpenChange={(open) => !open && setPendingCopy(null)}
				onSave={saveSellerName}
				onCopyAnyway={() => {
					if (pendingCopy) copyMessage(pendingCopy.block, pendingCopy.openWhatsapp)
					setPendingCopy(null)
				}}
			/>

			<AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Apagar o plano de venda?</AlertDialogTitle>
						<AlertDialogDescription>
							As mensagens, os envios marcados e os checklists de {company.name} serão apagados. Isso não pode ser desfeito.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
						<AlertDialogAction variant='destructive' onClick={handleDelete} disabled={busy}>
							Apagar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
