import type { Lead } from 'src/types'

const TEMPLATE =
	'/landing-page create an landing page for this {instagram} handle and maps {google_fotos_link} ask me anything you are unsure'

/** Perfil do Instagram da empresa, quando é ele o site cadastrado no Google. */
export const instagramUrl = (lead: Lead) => (lead.siteStatus === 'INSTAGRAM_ONLY' ? lead.websiteUri : null)

/** Fotos da empresa no Google Maps; sem elas, a página da empresa no Maps. */
export const googlePhotosUrl = (lead: Lead) => lead.photosUri ?? lead.googleMapsUri

/**
 * Pedido de landing page com o Instagram e as fotos da empresa no Google.
 * O que faltar continua como marcador (`{instagram}`, `{google_fotos_link}`) para ser preenchido à mão.
 * @returns O texto e a lista de marcadores que ficaram sem valor.
 */
export function landingPagePrompt(lead: Lead) {
	const values = { '{instagram}': instagramUrl(lead), '{google_fotos_link}': googlePhotosUrl(lead) }
	const text = Object.entries(values).reduce((prompt, [marker, value]) => prompt.replace(marker, value ?? marker), TEMPLATE)
	const missing = Object.entries(values)
		.filter(([, value]) => !value)
		.map(([marker]) => marker)
	return { text, missing }
}
