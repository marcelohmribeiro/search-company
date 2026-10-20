import { prisma } from "./prisma.js";
import { settings } from "#src/config";
import { fingerprint, httpError } from "#src/utils";

const RESERVATION_LOCK_KEY = 990001;

const periodFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: "America/Los_Angeles",
	year: "numeric",
	month: "2-digit",
});

/** Mês da cota do Google, no fuso do Pacífico ("2026-10"). */
function currentPeriod() {
	return periodFormatter.format(new Date());
}

/** Requisições do mês feitas pelo usuário ou com a chave informada, por qualquer conta. */
function usageWhere(period, userId, apiKey) {
	return { period, OR: apiKey ? [{ userId }, { keyHash: fingerprint(apiKey) }] : [{ userId }] };
}

function limitReached(period) {
	return httpError(429, `Limite de ${settings.MONTHLY_REQUEST_LIMIT} requisições do mês ${period} atingido.`);
}

/** Uso da Places API no mês: `{ period, used, limit, remaining }`. */
async function getUsage(userId, apiKey) {
	const period = currentPeriod();
	const used = await prisma.apiRequest.count({ where: usageWhere(period, userId, apiKey) });
	const limit = settings.MONTHLY_REQUEST_LIMIT;
	return { period, used, limit, remaining: Math.max(limit - used, 0) };
}

/** Lança 429 se o mês já atingiu o limite. */
async function assertQuota(userId, apiKey) {
	const usage = await getUsage(userId, apiKey);
	if (usage.remaining <= 0) throw limitReached(usage.period);
}

/** Registra uma requisição antes de enviá-la ao Google. Lança 429 se o mês já atingiu o limite. */
async function reserveRequest({ searchId, page, userId, apiKey }) {
	return prisma.$transaction(async (tx) => {
		await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RESERVATION_LOCK_KEY})`;
		const period = currentPeriod();
		const used = await tx.apiRequest.count({ where: usageWhere(period, userId, apiKey) });
		if (used >= settings.MONTHLY_REQUEST_LIMIT) throw limitReached(period);
		return tx.apiRequest.create({ data: { period, page, searchId, userId, keyHash: fingerprint(apiKey) } });
	});
}

/** Grava o resultado de uma requisição reservada. */
async function finishRequest(id, { status, httpStatus, resultsCount, error, response }) {
	return prisma.apiRequest.update({
		where: { id },
		data: { status, httpStatus, resultsCount, error, response, finishedAt: new Date() },
	});
}

export { getUsage, assertQuota, reserveRequest, finishRequest };
