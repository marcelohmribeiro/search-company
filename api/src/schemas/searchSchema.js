import { z } from "zod";

// Espaços repetidos viram um só, para "barbearia  em Aldeota" e "barbearia em Aldeota" contarem como a mesma busca.
const searchText = z.string().trim().overwrite((value) => value.replace(/\s+/g, " ")).max(100);

/**
 * Corpo de `POST /searches`. `maxPages` vai de 1 a 3 porque a Text Search devolve no máximo
 * 60 resultados (3 páginas de 20). `neighborhood` vazio vira `undefined` (busca na cidade toda).
 */
const searchInputSchema = z.object({
	city: searchText.min(1),
	category: searchText.min(1),
	neighborhood: searchText.nullish().transform((neighborhood) => neighborhood || undefined),
	maxPages: z.coerce.number().int().min(1).max(3).default(3),
	skipIfDone: z.boolean().default(true),
});

/**
 * Header `X-Google-Api-Key` de `POST /searches`: a chave da API do Google de quem faz a busca.
 * As chaves do Google têm 39 caracteres; o limite só barra valores absurdos.
 */
const googleApiKeySchema = z
	.string({ error: "Informe a chave da API do Google." })
	.trim()
	.min(1, "Informe a chave da API do Google.")
	.max(200, "Chave da API do Google inválida.");

export { searchInputSchema, googleApiKeySchema };
