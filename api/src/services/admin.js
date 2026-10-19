import { prisma } from "./prisma.js";
import { getUsage } from "./usage.js";
import { httpError } from "#src/utils";

const SUMMARY_SELECT = {
	id: true,
	email: true,
	role: true,
	createdAt: true,
	googleApiKeyHash: true,
	_count: { select: { leads: true, searches: true, accesses: true } },
	accesses: { orderBy: { lastSeenAt: "desc" }, take: 1, select: { lastSeenAt: true } },
};

async function toSummary({ googleApiKeyHash, _count, accesses, ...user }) {
	return {
		...user,
		hasGoogleApiKey: Boolean(googleApiKeyHash),
		leadsCount: _count.leads,
		searchesCount: _count.searches,
		accessesCount: _count.accesses,
		lastAccessAt: accesses[0]?.lastSeenAt ?? null,
		usage: await getUsage(user.id),
	};
}

/** Todos os usuários, com os números de cada um, para o painel admin. */
async function listUsers() {
	const users = await prisma.user.findMany({ select: SUMMARY_SELECT, orderBy: { id: "asc" } });
	return Promise.all(users.map(toSummary));
}

/**
 * Um usuário, com os mesmos números da listagem.
 * @throws 404 se o usuário não existe.
 */
async function getUserSummary(id) {
	const user = await prisma.user.findUnique({ where: { id }, select: SUMMARY_SELECT });
	if (!user) throw httpError(404, "Usuário não encontrado.");
	return toSummary(user);
}

/**
 * Entradas do usuário no app, as mais recentes primeiro.
 * @param {number} userId
 * @param {number} [take]
 */
async function listAccesses(userId, take = 200) {
	return prisma.userAccess.findMany({
		where: { userId },
		select: { id: true, startedAt: true, lastSeenAt: true },
		orderBy: { startedAt: "desc" },
		take,
	});
}

export { listUsers, getUserSummary, listAccesses };
