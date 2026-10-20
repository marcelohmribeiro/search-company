import { randomBytes } from "node:crypto";
import { prisma } from "./prisma.js";
import { fingerprint, httpError } from "#src/utils";

// O prefixo deixa o middleware separar um token pessoal de um JWT sem tentar decodificar.
const API_TOKEN_PREFIX = "sc_";
const MAX_TOKENS_PER_USER = 10;
// Atualizar o último uso a cada chamada seria uma escrita por requisição; uma vez por minuto basta para a tela.
const LAST_USED_GAP_MS = 60_000;

const SUMMARY_SELECT = { id: true, name: true, lastChars: true, createdAt: true, lastUsedAt: true };

function isApiToken(value) {
	return typeof value === "string" && value.startsWith(API_TOKEN_PREFIX);
}

/** Tokens do usuário, os mais recentes primeiro. O valor de cada um não é guardado e não volta. */
async function listApiTokens(userId) {
	return prisma.apiToken.findMany({ where: { userId }, select: SUMMARY_SELECT, orderBy: { createdAt: "desc" } });
}

/**
 * Cria um token pessoal. O valor só existe na resposta desta chamada; o banco guarda o SHA-256.
 * @returns {Promise<object>} O resumo do token com `token`, o valor completo.
 * @throws 409 se o usuário já tem `MAX_TOKENS_PER_USER` tokens.
 */
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

/**
 * Revoga (apaga) um token do usuário. Ele para de funcionar na hora.
 * @throws 404 se o token não existe ou é de outro usuário.
 */
async function revokeApiToken(userId, id) {
	const { count } = await prisma.apiToken.deleteMany({ where: { id, userId } });
	if (!count) throw httpError(404, "Token não encontrado.");
}

/**
 * Dono de um token pessoal, ou `null` se ele não existe (nunca existiu ou foi revogado).
 * Registra o uso, no máximo uma vez por minuto.
 */
async function findApiTokenUser(token) {
	const tokenHash = fingerprint(token);
	const apiToken = await prisma.apiToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true } });
	if (!apiToken) return null;

	const now = new Date();
	await prisma.apiToken.updateMany({
		where: {
			id: apiToken.id,
			OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: new Date(now.getTime() - LAST_USED_GAP_MS) } }],
		},
		data: { lastUsedAt: now },
	});
	return apiToken.userId;
}

export { isApiToken, listApiTokens, createApiToken, revokeApiToken, findApiTokenUser };
