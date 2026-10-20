import { randomBytes } from "node:crypto";
import { prisma } from "./prisma.js";
import { fingerprint, httpError } from "#src/utils";

const API_TOKEN_PREFIX = "sc_";
const MAX_TOKENS_PER_USER = 10;
const LAST_USED_GAP_MS = 60_000;

const SUMMARY_SELECT = { id: true, name: true, lastChars: true, createdAt: true, lastUsedAt: true };

/** Indica se o valor tem o formato de um token pessoal (`sc_...`). */
function isApiToken(value) {
	return typeof value === "string" && value.startsWith(API_TOKEN_PREFIX);
}

/** Tokens do usuário, os mais recentes primeiro, sem o valor. */
async function listApiTokens(userId) {
	return prisma.apiToken.findMany({ where: { userId }, select: SUMMARY_SELECT, orderBy: { createdAt: "desc" } });
}

/** Cria um token pessoal e devolve o valor completo uma única vez. Lança 409 acima de 10 tokens. */
async function createApiToken(userId, { name }) {
	const count = await prisma.apiToken.count({ where: { userId } });
	if (count >= MAX_TOKENS_PER_USER) {
		throw httpError(409, `Você já tem ${MAX_TOKENS_PER_USER} tokens. Revogue um antes de criar outro.`);
	}

	const token = API_TOKEN_PREFIX + randomBytes(32).toString("base64url");
	const created = await prisma.apiToken.create({
		data: { userId, name, tokenHash: fingerprint(token), lastChars: token.slice(-4) },
		select: SUMMARY_SELECT,
	});
	return { ...created, token };
}

/** Apaga um token do usuário. Lança 404 se ele não existe ou é de outro usuário. */
async function revokeApiToken(userId, id) {
	const { count } = await prisma.apiToken.deleteMany({ where: { id, userId } });
	if (!count) throw httpError(404, "Token não encontrado.");
}

function touchLastUsed(id) {
	const now = new Date();
	return prisma.apiToken.updateMany({
		where: { id, OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: new Date(now.getTime() - LAST_USED_GAP_MS) } }] },
		data: { lastUsedAt: now },
	});
}

/** Id do dono de um token pessoal, ou `null` se ele não existe. Atualiza o último uso. */
async function findApiTokenUser(token) {
	const apiToken = await prisma.apiToken.findUnique({ where: { tokenHash: fingerprint(token) }, select: { id: true, userId: true } });
	if (!apiToken) return null;
	await touchLastUsed(apiToken.id);
	return apiToken.userId;
}

export { isApiToken, listApiTokens, createApiToken, revokeApiToken, findApiTokenUser };
