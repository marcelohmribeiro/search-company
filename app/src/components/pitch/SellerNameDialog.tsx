import { useState } from 'react'
import type { FormEvent } from 'react'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import { Button } from 'src/components/ui/button'
import { Field, FieldLabel } from 'src/components/ui/field'
import { Input } from 'src/components/ui/input'
import { Spinner } from 'src/components/ui/spinner'
import { SELLER_PLACEHOLDER } from 'src/lib/pitch'

interface SellerNameDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Salva o nome e segue com a cópia. */
	onSave: (name: string) => Promise<void>
	/** Copia com o placeholder no texto. */
	onCopyAnyway: () => void
}

/** Aviso antes de copiar uma mensagem com `{{vendedor}}` sem nome definido. */
export default function SellerNameDialog({ open, onOpenChange, onSave, onCopyAnyway }: SellerNameDialogProps) {
	const [name, setName] = useState('')
	const [saving, setSaving] = useState(false)

	async function handleSubmit(event: FormEvent) {
		event.preventDefault()
		setSaving(true)
		try {
			await onSave(name.trim())
		} finally {
			setSaving(false)
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className='data-[size=default]:sm:max-w-md'>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<AlertDialogHeader>
						<AlertDialogTitle>A mensagem vai sem o seu nome</AlertDialogTitle>
						<AlertDialogDescription>
							O texto tem <code>{SELLER_PLACEHOLDER}</code> e você ainda não definiu como quer se apresentar. Se copiar assim,
							o placeholder vai junto para o cliente.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<Field>
						<FieldLabel htmlFor='seller-name'>Seu nome nas mensagens</FieldLabel>
						<Input
							id='seller-name'
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder='Gabriel'
							maxLength={80}
							autoFocus
						/>
					</Field>
					<AlertDialogFooter>
						<AlertDialogCancel type='button'>Cancelar</AlertDialogCancel>
						<Button type='button' variant='outline' onClick={onCopyAnyway}>
							Copiar mesmo assim
						</Button>
						<Button type='submit' disabled={saving || !name.trim()}>
							{saving && <Spinner />}
							Salvar e copiar
						</Button>
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	)
}
