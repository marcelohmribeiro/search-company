import { prisma } from "./prisma.js";
import { settings } from "#src/config";
import { httpError } from "#src/utils";

// Chave arbitrária do advisory lock que serializa as reservas de requisição no Postgres.
const RESERVATION_LOCK_KEY = 990001;

// A cota grátis do Google reinicia à meia-noite do dia 1 no horário do Pacífico.
const periodFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: "America/Los_Angeles",
	year: "numeric",
	month: "2-digit",
});

/** Mês de cobrança do Google em que estamos, no formato "2026-10". */
function currentPeriod() {
	return periodFormatter.format(new Date());
}

/**
 * Requisições que contam no mês do usuário: as que ele fez, com qualquer chave, e as feitas com a chave
 * atual dele, por qualquer conta. Assim, trocar de chave ou passar uma chave para outra conta não zera o uso.
 */
function usageWhere(period, userId, keyHash) {
	return { period, OR: keyHash ? [{ userId }, { keyHash }] : [{ userId }] };
}

/**
 * Uso da Places API do usuário no mês de cobrança atual.
 * @returns {Promise<{ period: string, used: number, limit: number, remaining: number }>}
 */
async function getUsage(userId) {
	const period = currentPeriod();
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { googleApiKeyHash: true } });
	const used = await prisma.apiRequest.count({ where: usageWhere(period, userId, user?.googleApiKeyHash) });
	const limit = settings.MONTHLY_REQUEST_LIMIT;
	return { period, used, limit, remaining: Math.max(limit - used, 0) };
}

/**
 * Registra uma requisição à Places API antes de ela ser enviada.
 * A contagem e a criação rodam sob um advisory lock para que reservas simultâneas não passem do limite.
 * @param {{ searchId: number, page: number, userId: number, keyHash: string }} params
 * @returns {Promise<import("../../generated/prisma/client.js").ApiRequest>} Linha criada com status `PENDING`.
 * @throws Erro 429 quando o mês do usuário já atingiu `MONTHLY_REQUEST_LIMIT`.
 */
async function reserveRequest({ searchId, page, userId, keyHash }) {
	return prisma.$transaction(async (tx) => {
		await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RESERVATION_LOCK_KEY})`;

		const period = currentPeriod();
		const used = await tx.apiRequest.count({ where: usageWhere(period, userId, keyHash) });
		if (used >= settings.MONTHLY_REQUEST_LIMIT) {
			throw httpError(429, `Limite de ${settings.MONTHLY_REQUEST_LIMIT} requisições do mês ${period} atingido.`);
		}

		return tx.apiRequest.create({ data: { period, page, searchId, userId, keyHash } });
	});
}

/**
 * Grava o resultado de uma requisição reservada. A linha continua contando no uso do mês.
 * @param {number} id
 * @param {{ status: "SUCCESS" | "ERROR", httpStatus?: number, resultsCount?: number, error?: string, response?: object }} result
 * `response` é o corpo da resposta do Google, guardado sem alteração.
 */
async function finishRequest(id, { status, httpStatus, resultsCount, error, response }) {
	return prisma.apiRequest.update({
		where: { id },
		data: { status, httpStatus, resultsCount, error, response, finishedAt: new Date() },
	});
}

export { getUsage, reserveRequest, finishRequest };
