import { z } from "zod";

const searchText = z.string().trim().overwrite((value) => value.replace(/\s+/g, " ")).max(100);

/** Corpo de `POST /searches`. `maxPages` vai de 1 a 3, o máximo de páginas da Text Search. */
const searchInputSchema = z.object({
	city: searchText.min(1),
	category: searchText.min(1),
	neighborhood: searchText.nullish().transform((neighborhood) => neighborhood || undefined),
	maxPages: z.coerce.number().int().min(1).max(3).default(3),
	skipIfDone: z.boolean().default(true),
});

/** Header `X-Google-Api-Key` com a chave da API do Google. */
const googleApiKeySchema = z
	.string({ error: "Informe a chave da API do Google." })
	.trim()
	.min(1, "Informe a chave da API do Google.")
	.max(200, "Chave da API do Google inválida.")
	.regex(/^\S+$/, "A chave da API do Google não tem espaços.");

/** `:id` de `GET /searches/:id/leads`. */
const searchIdSchema = z.coerce.number().int().positive();

export { searchInputSchema, googleApiKeySchema, searchIdSchema };
