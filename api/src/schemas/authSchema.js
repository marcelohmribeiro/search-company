import { z } from "zod";

// Sem espaços e em minúsculas, para o login não depender de como o e-mail foi digitado.
const email = z.string().trim().toLowerCase().pipe(z.email("E-mail inválido."));

/** Corpo de `POST /auth/login`. */
const loginSchema = z.object({
	email,
	password: z.string({ error: "Informe a senha." }).min(1, "Informe a senha."),
});

/** Dados do script de cadastro (`bun run user:create`). */
const userSchema = z.object({
	email,
	password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export { loginSchema, userSchema };
