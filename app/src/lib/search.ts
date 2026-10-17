/** Itens únicos de um texto separado por linha ou vírgula, sem espaços extras. */
export const parseList = (text: string) => [
	...new Set(
		text
			.split(/[\n,]/)
			.map((item) => item.trim().replace(/\s+/g, ' '))
			.filter(Boolean),
	),
]

/** Texto enviado ao Google, igual ao montado pelo backend. */
export const textQuery = (category: string, neighborhood: string | undefined, city: string) =>
	neighborhood ? `${category} em ${neighborhood}, ${city}` : `${category} em ${city}`
