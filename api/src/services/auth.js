import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";
import { getMe } from "./users.js";
import { settings } from "#src/config";
import { hashPassword, httpError, verifyPassword } from "#src/utils";

const TOKEN_EXPIRES_IN = "7d";

async function createSession(userId) {
	const token = jwt.sign({ id: userId }, settings.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
	return { token, user: await getMe(userId) };
}

/** Id do usuário de um JWT do login, ou `null` se o token é inválido ou venceu. */
function readSessionToken(token) {
	try {
		return jwt.verify(token, settings.JWT_SECRET).id;
	} catch {
		return null;
	}
}

/** Confere usuário e senha e devolve `{ token, user }`. Lança 401 com qualquer um dos dois errado. */
async function authenticate({ username, password }) {
	const user = await prisma.user.findUnique({ where: { username } });
	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		throw httpError(401, "Usuário ou senha inválidos.");
	}
	return createSession(user.id);
}

/** Cria um usuário comum e devolve `{ token, user }`. Lança 409 se o usuário já existe. */
async function register({ username, password }) {
	const passwordHash = await hashPassword(password);
	try {
		const user = await prisma.user.create({ data: { username, passwordHash }, select: { id: true } });
		return createSession(user.id);
	} catch (error) {
		if (error?.code === "P2002") throw httpError(409, "Esse usuário já existe.");
		throw error;
	}
}

export { authenticate, register, readSessionToken };
