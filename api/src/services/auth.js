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
 * Confere usuário e senha e abre uma sessão.
 * @param {{ username: string, password: string }} credentials Usuário já em minúsculas.
 * @returns {Promise<{ token: string, user: object }>}
 * @throws Erro 401 com usuário ou senha errados, sem dizer qual dos dois.
 */
async function authenticate({ username, password }) {
	const user = await prisma.user.findUnique({ where: { username } });
	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		throw httpError(401, "Usuário ou senha inválidos.");
	}
	return createSession(user.id);
}

/**
 * Cria a conta de um usuário comum (`USER`) e já abre a sessão dele.
 * @param {{ username: string, password: string }} data Usuário já em minúsculas.
 * @returns {Promise<{ token: string, user: object }>}
 * @throws Erro 409 se o usuário já existe.
 */
async function register({ username, password }) {
	const passwordHash = await hashPassword(password);
	try {
		const user = await prisma.user.create({ data: { username, passwordHash }, select: { id: true } });
		return createSession(user.id);
	} catch (error) {
		// P2002: violação do usuário único, inclusive quando duas contas iguais são criadas ao mesmo tempo.
		if (error?.code === "P2002") {
			throw httpError(409, "Esse usuário já existe.");
		}
		throw error;
	}
}

export { authenticate, register };
