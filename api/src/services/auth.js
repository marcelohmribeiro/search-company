import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";
import { getMe } from "./users.js";
import { settings } from "#src/config";
import { hashPassword, httpError, verifyPassword } from "#src/utils";

const TOKEN_EXPIRES_IN = "7d";

/**
 * Confere e-mail e senha e devolve um JWT com o id do usuário, válido por 7 dias, e os dados dele (`getMe`).
 * @param {{ email: string, password: string }} credentials E-mail já em minúsculas.
 * @returns {Promise<{ token: string, user: object }>}
 * @throws Erro 401 com e-mail ou senha errados, sem dizer qual dos dois.
 */
async function authenticate({ email, password }) {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		throw httpError(401, "E-mail ou senha inválidos.");
	}

	const token = jwt.sign({ id: user.id }, settings.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
	return { token, user: await getMe(user.id) };
}

/**
 * Cria o usuário ou, se o e-mail já existe, troca a senha dele.
 * @param {{ email: string, password: string, role?: "ADMIN" | "USER" }} data E-mail já em minúsculas. Sem `role`,
 * um usuário novo é `USER` e um existente mantém o papel.
 * @returns {Promise<{ user: { id: number, email: string, role: string }, created: boolean }>}
 */
async function saveUser({ email, password, role }) {
	const passwordHash = await hashPassword(password);
	const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
	const user = await prisma.user.upsert({
		where: { email },
		create: { email, passwordHash, role },
		update: { passwordHash, role },
		select: { id: true, email: true, role: true },
	});
	return { user, created: !existing };
}

export { authenticate, saveUser };
