const onlyDigits = (phone: string | null) => phone?.replace(/\D/g, '') ?? ''

/** Link do WhatsApp para o telefone internacional, ou `null` sem telefone. */
export function whatsappUrl(internationalPhone: string | null) {
	const digits = onlyDigits(internationalPhone)
	return digits ? `https://wa.me/${digits}` : null
}

/** Indica celular brasileiro: 55 + DDD + 9 dígitos começando com 9. */
export function isBrazilianMobile(internationalPhone: string | null) {
	const digits = onlyDigits(internationalPhone)
	return digits.length === 13 && digits.startsWith('55') && digits[4] === '9'
}
