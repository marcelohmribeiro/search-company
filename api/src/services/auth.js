import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";
import { getMe } from "./users.js";
import { settings } from "#src/config";
import { hashPassword, httpError, verifyPassword } from "#src/utils";

const TOKEN_EXPIRES_IN = "7d";

/** JWT com o id do usuário, válido por 7 dias, e os dados dele (`getMe`). */
async function createSession(userId) {
	const token = jwt.sign({ id: userId }, settings.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
	return { token, user: await getMe(userId) };
}

/**
 * Confere e-mail e senha e abre uma sessão.
 * @param {{ email: string, password: string }} credentials E-mail já em minúsculas.
 * @returns {Promise<{ token: string, user: object }>}
 * @throws Erro 401 com e-mail ou senha errados, sem dizer qual dos dois.
 */
async function authenticate({ email, password }) {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		throw httpError(401, "E-mail ou senha inválidos.");
	}
	return createSession(user.id);
}

/**
 * Cria a conta de um usuário comum (`USER`) e já abre a sessão dele.
 * @param {{ email: string, password: string }} data E-mail já em minúsculas.
 * @returns {Promise<{ token: string, user: object }>}
 * @throws Erro 409 se o e-mail já tem conta.
 */
async function register({ email, password }) {
	const passwordHash = await hashPassword(password);
	try {
		const user = await prisma.user.create({ data: { email, passwordHash }, select: { id: true } });
		return createSession(user.id);
	} catch (error) {
		// P2002: violação do e-mail único, inclusive quando duas contas iguais são criadas ao mesmo tempo.
		if (error?.code === "P2002") {
			throw httpError(409, "Já existe uma conta com esse e-mail.");
		}
		throw error;
	}
}

export { authenticate, register };
