import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "./prisma.js";
import { httpError } from "#src/utils";

/** Pasta das imagens em dev, quando não há `BLOB_READ_WRITE_TOKEN`. Servida em `/uploads`. */
export const LOCAL_UPLOADS_DIR = path.resolve("uploads");
export const MAX_PROPOSALS = 10;
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Todo card sai da API com as propostas em ordem. */
const withProposals = { proposals: { orderBy: { position: "asc" } } };

/** Projetos (leads `CLOSED` do usuário) e os cards deles, em ordem. */
async function getBoard(userId) {
	const closed = await prisma.userLead.findMany({
		where: { userId, status: "CLOSED" },
		select: { leadId: true, lead: { select: { name: true } } },
		orderBy: { lead: { name: "asc" } },
	});
	const projects = closed.map((row) => ({ leadId: row.leadId, name: row.lead.name }));
	const cards = await prisma.projectCard.findMany({
		where: { userId, leadId: { in: projects.map((project) => project.leadId) } },
		orderBy: [{ column: "asc" }, { position: "asc" }],
		include: withProposals,
	});
	return { projects, cards };
}

async function findCard(userId, id) {
	const card = await prisma.projectCard.findFirst({ where: { id, userId }, include: withProposals });
	if (!card) throw httpError(404, "Card não encontrado.");
	return card;
}

const reloadCard = (id) => prisma.projectCard.findUnique({ where: { id }, include: withProposals });

async function createCard(userId, input) {
	const project = await prisma.userLead.findUnique({ where: { userId_leadId: { userId, leadId: input.leadId } } });
	if (project?.status !== "CLOSED") throw httpError(400, "O projeto precisa ser um lead fechado da sua lista.");
	const last = await prisma.projectCard.findFirst({
		where: { userId, column: input.column },
		orderBy: { position: "desc" },
	});
	return prisma.projectCard.create({
		data: { ...input, userId, position: (last?.position ?? 0) + 1 },
		include: withProposals,
	});
}

async function updateCard(userId, id, change) {
	await findCard(userId, id);
	return prisma.projectCard.update({ where: { id }, data: change, include: withProposals });
}

async function removeImage(url) {
	if (!url) return;
	try {
		if (url.startsWith("/uploads/")) await unlink(path.join(LOCAL_UPLOADS_DIR, path.basename(url)));
		else if (useBlob()) await del(url);
	} catch (error) {
		console.error("Não foi possível apagar a imagem antiga:", error.message);
	}
}

async function deleteCard(userId, id) {
	const card = await findCard(userId, id);
	await prisma.projectCard.delete({ where: { id } });
	await Promise.all([card.imageUrl, ...card.proposals.map((proposal) => proposal.url)].map(removeImage));
}

/** Normaliza para WebP (até 1600px), guarda no Blob (ou em disco em dev) e devolve a URL pública. */
async function storeImage(userId, buffer) {
	let webp;
	try {
		const meta = await sharp(buffer).metadata();
		// O app já envia WebP reduzido; só recomprime o que chega grande ou em outro formato.
		const ready = meta.format === "webp" && Math.max(meta.width, meta.height) <= 1600 && buffer.length <= 1_500_000;
		webp = ready ? buffer : await sharp(buffer).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
	} catch {
		throw httpError(400, "Imagem inválida.");
	}
	const name = `${randomUUID()}.webp`;
	if (useBlob()) {
		const blob = await put(`board/${userId}/${name}`, webp, { access: "public", contentType: "image/webp" });
		return blob.url;
	}
	await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
	await writeFile(path.join(LOCAL_UPLOADS_DIR, name), webp);
	return `/uploads/${name}`;
}

/** Troca a capa ("atual") do card. */
async function setCardImage(userId, id, buffer) {
	const card = await findCard(userId, id);
	const imageUrl = await storeImage(userId, buffer);
	const updated = await prisma.projectCard.update({ where: { id }, data: { imageUrl }, include: withProposals });
	await removeImage(card.imageUrl);
	return updated;
}

async function deleteCardImage(userId, id) {
	const card = await findCard(userId, id);
	const updated = await prisma.projectCard.update({ where: { id }, data: { imageUrl: null }, include: withProposals });
	await removeImage(card.imageUrl);
	return updated;
}

/** Adiciona uma imagem de proposta no fim da lista. */
async function addProposal(userId, cardId, buffer, caption) {
	const card = await findCard(userId, cardId);
	if (card.proposals.length >= MAX_PROPOSALS) throw httpError(400, `Cada card aceita até ${MAX_PROPOSALS} propostas.`);
	const url = await storeImage(userId, buffer);
	const position = (card.proposals.at(-1)?.position ?? 0) + 1;
	await prisma.cardProposal.create({ data: { cardId, url, caption, position } });
	return reloadCard(cardId);
}

async function findProposal(userId, cardId, proposalId) {
	const card = await findCard(userId, cardId);
	const proposal = card.proposals.find((item) => item.id === proposalId);
	if (!proposal) throw httpError(404, "Proposta não encontrada.");
	return proposal;
}

async function updateProposal(userId, cardId, proposalId, change) {
	await findProposal(userId, cardId, proposalId);
	await prisma.cardProposal.update({ where: { id: proposalId }, data: change });
	return reloadCard(cardId);
}

async function deleteProposal(userId, cardId, proposalId) {
	const proposal = await findProposal(userId, cardId, proposalId);
	await prisma.cardProposal.delete({ where: { id: proposalId } });
	await removeImage(proposal.url);
	return reloadCard(cardId);
}

export {
	getBoard,
	createCard,
	updateCard,
	deleteCard,
	setCardImage,
	deleteCardImage,
	addProposal,
	updateProposal,
	deleteProposal,
};
