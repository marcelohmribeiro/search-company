import { z } from "zod";

// Sem espaços e em minúsculas, para o login não depender de como o e-mail foi digitado.
const email = z.string().trim().toLowerCase().pipe(z.email("E-mail inválido."));

/** Corpo de `POST /auth/login`. */
const loginSchema = z.object({
	email,
	password: z.string({ error: "Informe a senha." }).min(1, "Informe a senha."),
});

/** Corpo de `POST /auth/register`. */
const registerSchema = z.object({
	email,
	password: z
		.string({ error: "Informe a senha." })
		.min(8, "A senha precisa ter pelo menos 8 caracteres.")
		.max(200, "A senha pode ter no máximo 200 caracteres."),
});

export { loginSchema, registerSchema };
