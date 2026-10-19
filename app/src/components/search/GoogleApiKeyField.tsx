import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from 'src/components/ui/button'
import { Field, FieldLabel } from 'src/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from 'src/components/ui/input-group'
import { Spinner } from 'src/components/ui/spinner'
import { getErrorMessage, removeGoogleApiKey, saveGoogleApiKey } from 'src/services'
import { useAuthStore } from 'src/store/authStore'

/** Chave da API do Google da conta: salva no banco, cifrada, e usada em todas as buscas do usuário. */
export default function GoogleApiKeyField({ disabled }: { disabled: boolean }) {
	const user = useAuthStore((state) => state.user)
	const setUser = useAuthStore((state) => state.setUser)
	const [value, setValue] = useState('')
	const [showKey, setShowKey] = useState(false)
	const [editing, setEditing] = useState(false)
	const [saving, setSaving] = useState(false)

	const hasKey = user?.hasGoogleApiKey === true

	async function handleSave(event: FormEvent) {
		event.preventDefault()
		setSaving(true)
		try {
			setUser(await saveGoogleApiKey(value.trim()))
			setValue('')
			setEditing(false)
			toast.success('Chave do Google salva')
		} catch (error) {
			toast.error('Não foi possível salvar a chave', { description: getErrorMessage(error) })
		} finally {
			setSaving(false)
		}
	}

	async function handleRemove() {
		setSaving(true)
		try {
			setUser(await removeGoogleApiKey())
			toast.success('Chave do Google removida')
		} catch (error) {
			toast.error('Não foi possível remover a chave', { description: getErrorMessage(error) })
		} finally {
			setSaving(false)
		}
	}

	if (hasKey && !editing) {
		return (
			<Field data-disabled={disabled}>
				<FieldLabel>Chave da API do Google</FieldLabel>
				<div className='flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2'>
					<KeyRound className='size-4 shrink-0 text-muted-foreground' />
					<span className='flex-1 truncate text-sm'>
						{user.googleApiKeyEnd ? (
							<>
								Salva, termina em <span className='font-mono font-medium'>{user.googleApiKeyEnd}</span>
							</>
						) : (
							<span className='text-amber-700'>Salva, mas não pode ser lida. Salve de novo.</span>
						)}
					</span>
					<Button variant='ghost' size='sm' onClick={() => setEditing(true)} disabled={disabled || saving}>
						Trocar
					</Button>
					<Button
						variant='ghost'
						size='sm'
						className='text-destructive hover:text-destructive'
						onClick={handleRemove}
						disabled={disabled || saving}
					>
						{saving && <Spinner />}
						Remover
					</Button>
				</div>
			</Field>
		)
	}

	return (
		<Field data-disabled={disabled}>
			<FieldLabel htmlFor='api-key'>Chave da API do Google</FieldLabel>
			<form onSubmit={handleSave} className='flex gap-2'>
				<InputGroup>
					<InputGroupAddon>
						<KeyRound />
					</InputGroupAddon>
					<InputGroupInput
						id='api-key'
						type={showKey ? 'text' : 'password'}
						value={value}
						onChange={(event) => setValue(event.target.value)}
						placeholder='AIza…'
						autoComplete='off'
						spellCheck={false}
						disabled={disabled || saving}
					/>
					<InputGroupAddon align='inline-end'>
						<InputGroupButton
							size='icon-xs'
							onClick={() => setShowKey((current) => !current)}
							aria-label={showKey ? 'Esconder a chave' : 'Mostrar a chave'}
						>
							{showKey ? <EyeOff /> : <Eye />}
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
				<Button type='submit' disabled={disabled || saving || !value.trim()}>
					{saving && <Spinner />}
					Salvar
				</Button>
				{editing && (
					<Button type='button' variant='ghost' onClick={() => setEditing(false)} disabled={saving}>
						Cancelar
					</Button>
				)}
			</form>
		</Field>
	)
}
