import { z } from "zod";

const username = z.string({ error: "Informe o usuário." }).trim().toLowerCase();

/** Corpo de `POST /auth/login`. */
const loginSchema = z.object({
	username: username.min(1, "Informe o usuário."),
	password: z.string({ error: "Informe a senha." }).min(1, "Informe a senha."),
});

/** Corpo de `POST /auth/register`. */
const registerSchema = z.object({
	username: username
		.min(3, "O usuário precisa ter pelo menos 3 caracteres.")
		.max(30, "O usuário pode ter no máximo 30 caracteres.")
		.regex(/^[a-z0-9._-]+$/, "Use só letras sem acento, números, ponto, hífen e sublinhado no usuário."),
	password: z
		.string({ error: "Informe a senha." })
		.min(8, "A senha precisa ter pelo menos 8 caracteres.")
		.max(200, "A senha pode ter no máximo 200 caracteres."),
});

export { loginSchema, registerSchema };
