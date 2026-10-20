import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { Checkbox } from 'src/components/ui/checkbox'
import { Field, FieldDescription, FieldLabel } from 'src/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from 'src/components/ui/input-group'
import { Label } from 'src/components/ui/label'
import { useApiKeyStore } from 'src/store/apiKeyStore'

/**
 * Chave da API do Google de quem está buscando. Fica só neste navegador (na memória ou, com "Lembrar",
 * no localStorage) e vai junto de cada busca; o backend não a guarda.
 */
export default function GoogleApiKeyField({ disabled }: { disabled: boolean }) {
	const { apiKey, remember, setApiKey, setRemember } = useApiKeyStore()
	const [showKey, setShowKey] = useState(false)

	return (
		<Field data-disabled={disabled}>
			<FieldLabel htmlFor='api-key'>Chave da API do Google</FieldLabel>
			<InputGroup>
				<InputGroupAddon>
					<KeyRound />
				</InputGroupAddon>
				<InputGroupInput
					id='api-key'
					type={showKey ? 'text' : 'password'}
					value={apiKey}
					onChange={(event) => setApiKey(event.target.value)}
					placeholder='AIza…'
					autoComplete='off'
					spellCheck={false}
					disabled={disabled}
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
			<div className='flex items-center gap-2'>
				<Checkbox
					id='remember-api-key'
					checked={remember}
					onCheckedChange={(checked) => setRemember(checked === true)}
					disabled={disabled}
				/>
				<Label htmlFor='remember-api-key' className='font-normal'>
					Lembrar neste navegador
				</Label>
			</div>
			<FieldDescription>A chave fica só neste navegador e vai junto de cada busca. O servidor não a guarda.</FieldDescription>
		</Field>
	)
}
