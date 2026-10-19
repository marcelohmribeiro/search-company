import { z } from "zod";

/**
 * Corpo de `PUT /me/google-api-key`. As chaves do Google têm 39 caracteres; o limite só barra valores absurdos.
 */
const googleApiKeySchema = z.object({
	apiKey: z
		.string({ error: "Informe a chave da API do Google." })
		.trim()
		.min(1, "Informe a chave da API do Google.")
		.max(200, "Chave da API do Google inválida.")
		.regex(/^\S+$/, "A chave da API do Google não tem espaços."),
});

export { googleApiKeySchema };
