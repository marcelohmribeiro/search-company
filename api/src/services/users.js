import { prisma } from "./prisma.js";
import { decrypt, encrypt, fingerprint, httpError } from "#src/utils";

// Aberturas do app com menos que isso de intervalo contam como a mesma entrada.
const ACCESS_GAP_MS = 30 * 60_000;

const ME_SELECT = { id: true, email: true, role: true, googleApiKey: true };

/** Últimos 4 caracteres da chave salva, para a tela mostrar qual é. `null` se ela não puder ser lida. */
function googleApiKeyEnd(stored) {
	try {
		return decrypt(stored).slice(-4);
	} catch {
		return null;
	}
}

/** Usuário como o front recebe: a chave do Google nunca sai da API, só se ela existe e como termina. */
function toMe({ googleApiKey, ...user }) {
	return {
		...user,
		hasGoogleApiKey: Boolean(googleApiKey),
		googleApiKeyEnd: googleApiKey ? googleApiKeyEnd(googleApiKey) : null,
	};
}

/**
 * Dados do usuário logado.
 * @throws 401 se o usuário do token não existe mais.
 */
async function getMe(userId) {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: ME_SELECT });
	if (!user) throw httpError(401, "Usuário não encontrado.");
	return toMe(user);
}

/**
 * Registra uma abertura do app. Dentro de 30 minutos da anterior, só estende a mesma entrada.
 */
async function recordAccess(userId) {
	const now = new Date();
	const { count } = await prisma.userAccess.updateMany({
		where: { userId, lastSeenAt: { gte: new Date(now.getTime() - ACCESS_GAP_MS) } },
		data: { lastSeenAt: now },
	});
	if (!count) await prisma.userAccess.create({ data: { userId, startedAt: now, lastSeenAt: now } });
}

/**
 * Salva a chave da API do Google do usuário, cifrada. Ela vale para todas as buscas dele.
 * @throws 409 se a chave já está em outra conta: o limite do mês é contado por chave.
 */
async function saveGoogleApiKey(userId, apiKey) {
	const googleApiKeyHash = fingerprint(apiKey);
	const owner = await prisma.user.findUnique({ where: { googleApiKeyHash }, select: { id: true } });
	if (owner && owner.id !== userId) throw httpError(409, "Essa chave já está cadastrada em outra conta.");

	const user = await prisma.user.update({
		where: { id: userId },
		data: { googleApiKey: encrypt(apiKey), googleApiKeyHash },
		select: ME_SELECT,
	});
	return toMe(user);
}

async function removeGoogleApiKey(userId) {
	const user = await prisma.user.update({
		where: { id: userId },
		data: { googleApiKey: null, googleApiKeyHash: null },
		select: ME_SELECT,
	});
	return toMe(user);
}

/**
 * Chave do Google do usuário, decifrada, para repassar ao Google. Não vai para o log nem para o front.
 * @returns {Promise<{ apiKey: string, keyHash: string }>}
 * @throws 400 sem chave salva, ou com uma chave que não pode mais ser lida.
 */
async function getGoogleApiKey(userId) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { googleApiKey: true, googleApiKeyHash: true },
	});
	if (!user?.googleApiKey) throw httpError(400, "Salve a sua chave da API do Google antes de buscar.");

	try {
		return { apiKey: decrypt(user.googleApiKey), keyHash: user.googleApiKeyHash };
	} catch {
		throw httpError(400, "Não foi possível ler a chave do Google salva. Salve a chave de novo.");
	}
}

export { getMe, recordAccess, saveGoogleApiKey, removeGoogleApiKey, getGoogleApiKey };
