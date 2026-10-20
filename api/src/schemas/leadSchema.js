import { z } from "zod";

const SITE_STATUSES = ["NO_WEBSITE", "INSTAGRAM_ONLY", "WHATSAPP_ONLY", "FACEBOOK_ONLY", "LINK_AGGREGATOR", "HAS_WEBSITE"];
const LEAD_STATUSES = ["NEW", "IN_PROGRESS", "DONE", "CONTACTED", "REPLIED", "CLOSED", "DISCARDED"];
const BUSINESS_STATUSES = ["OPERATIONAL", "CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY", "FUTURE_OPENING"];

/** Lista separada por vírgula com valores de `values`. */
const commaList = (values) =>
	z
		.string()
		.transform((text) => text.split(",").map((item) => item.trim()).filter(Boolean))
		.pipe(z.array(z.enum(values)));

const withoutEmptyValues = (query) => Object.fromEntries(Object.entries(query ?? {}).filter(([, value]) => value !== ""));

/** Query string de `GET /leads`: filtros, paginação e ordenação. */
const leadQuerySchema = z.preprocess(
	withoutEmptyValues,
	z.object({
		siteStatus: commaList(SITE_STATUSES).optional(),
		status: commaList(LEAD_STATUSES).optional(),
		businessStatus: commaList(BUSINESS_STATUSES).optional(),
		minRating: z.coerce.number().min(0).max(5).optional(),
		minReviews: z.coerce.number().int().min(0).optional(),
		city: z.string().trim().optional(),
		category: z.string().trim().optional(),
		neighborhood: z.string().trim().optional(),
		q: z.string().trim().optional(),
		page: z.coerce.number().int().min(1).default(1),
		pageSize: z.coerce.number().int().min(1).max(100).default(50),
		orderBy: z.enum(["reviews", "rating", "name", "recent"]).default("reviews"),
	}),
);

/** Corpo de `PATCH /leads/:id`: `status` e `notes`; `notes` vazio vira `null`. */
const leadUpdateSchema = z
	.object({
		status: z.enum(LEAD_STATUSES).optional(),
		notes: z
			.string()
			.trim()
			.max(5000)
			.nullish()
			.transform((notes) => (notes === "" ? null : notes)),
	})
	.refine((data) => data.status !== undefined || data.notes !== undefined, 'Informe "status" ou "notes".');

export { leadQuerySchema, leadUpdateSchema };
