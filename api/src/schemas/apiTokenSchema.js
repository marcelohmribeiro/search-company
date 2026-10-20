import { z } from "zod";

/** Corpo de `POST /me/tokens`. */
const apiTokenInputSchema = z.object({
	name: z
		.string({ error: "Dê um nome ao token." })
		.trim()
		.min(1, "Dê um nome ao token.")
		.max(50, "O nome pode ter no máximo 50 caracteres."),
});

/** `:id` de `DELETE /me/tokens/:id`. */
const apiTokenIdSchema = z.coerce.number().int().positive();

export { apiTokenInputSchema, apiTokenIdSchema };
