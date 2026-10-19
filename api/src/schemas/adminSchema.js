import { z } from "zod";

/** `:id` das rotas `/admin/users/:id`. */
const userIdSchema = z.coerce.number().int().positive();

export { userIdSchema };
