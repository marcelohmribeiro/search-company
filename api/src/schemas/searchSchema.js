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

export { searchInputSchema };
