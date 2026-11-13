import { z } from "zod";

export const BOARD_COLUMNS = ["BACKLOG", "TODO", "REVIEW", "DONE"];

const description = z
	.string()
	.max(10000)
	.nullish()
	.transform((text) => (text?.trim() ? text : null));

/** Corpo de `POST /board/cards`. Sem `column`, o card entra no Backlog, no fim da coluna. */
export const cardCreateSchema = z.object({
	leadId: z.string().trim().min(1),
	title: z.string().trim().min(1).max(200),
	description,
	column: z.enum(BOARD_COLUMNS).default("BACKLOG"),
});

/** Corpo de `PATCH /board/cards/:id`. Mover é mandar `column` e `position` juntos. */
export const cardUpdateSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	description: description.optional(),
	column: z.enum(BOARD_COLUMNS).optional(),
	position: z.number().finite().optional(),
});
