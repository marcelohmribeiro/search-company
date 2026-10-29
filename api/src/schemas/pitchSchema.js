import { z } from "zod";

const optionalText = (max) =>
	z
		.string()
		.trim()
		.max(max)
		.nullish()
		.transform((text) => (text ? text : null));

const blockId = z.string().trim().min(1).max(64).optional();

const markdownBlock = z.object({
	type: z.literal("markdown"),
	id: blockId,
	title: z.string().trim().max(200).default(""),
	body: z.string().max(20000).default(""),
});

const messageBlock = z.object({
	type: z.literal("message"),
	id: blockId,
	label: z.string().trim().max(200).default(""),
	group: z.enum(["main", "followup", "alternative"]).default("main"),
	dayOffset: z.coerce.number().int().min(0).max(365).default(0),
	body: z.string().max(5000).default(""),
	sentAt: z.iso.datetime().nullish(),
});

const checklistBlock = z.object({
	type: z.literal("checklist"),
	id: blockId,
	title: z.string().trim().max(200).default(""),
	items: z
		.array(z.object({ id: blockId, text: z.string().trim().max(1000), done: z.boolean().optional() }))
		.max(100)
		.default([]),
});

/** Corpo de `PUT /leads/:id/pitch`. Blocos sem `id` ganham um; `sentAt` e `done` omitidos mantêm o valor salvo. */
const pitchInputSchema = z.object({
	demoUrl: optionalText(500),
	decisionMaker: optionalText(200),
	contactWhatsapp: optionalText(200),
	contactNotes: optionalText(2000),
	blocks: z.array(z.discriminatedUnion("type", [markdownBlock, messageBlock, checklistBlock])).max(60).default([]),
});

/** Corpo de `PATCH /leads/:id/pitch/blocks/:blockId`: `sent` numa mensagem, ou `itemId` + `done` num checklist. */
const pitchBlockUpdateSchema = z.union([
	z.object({ sent: z.boolean() }),
	z.object({ itemId: z.string().min(1), done: z.boolean() }),
]);

export { pitchInputSchema, pitchBlockUpdateSchema };
