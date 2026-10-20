import { prisma } from "./prisma.js";
import { httpError } from "#src/utils";

const ACCESS_GAP_MS = 30 * 60_000;

/** Dados do usuário logado. Lança 401 se ele não existe mais. */
async function getMe(userId) {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, role: true } });
	if (!user) throw httpError(401, "Usuário não encontrado.");
	return user;
}

/** Indica se o usuário é administrador, lendo o papel atual no banco. */
async function isAdmin(userId) {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
	return user?.role === "ADMIN";
}

/** Registra uma abertura do app. Dentro de 30 minutos da anterior, estende a mesma entrada. */
async function recordAccess(userId) {
	const now = new Date();
	const { count } = await prisma.userAccess.updateMany({
		where: { userId, lastSeenAt: { gte: new Date(now.getTime() - ACCESS_GAP_MS) } },
		data: { lastSeenAt: now },
	});
	if (!count) await prisma.userAccess.create({ data: { userId, startedAt: now, lastSeenAt: now } });
}

export { getMe, isAdmin, recordAccess };
