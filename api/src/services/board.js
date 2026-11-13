import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "./prisma.js";
import { httpError } from "#src/utils";

/** Pasta das imagens em dev, quando não há `BLOB_READ_WRITE_TOKEN`. Servida em `/uploads`. */
export const LOCAL_UPLOADS_DIR = path.resolve("uploads");
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

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
	});
	return { projects, cards };
}

async function findCard(userId, id) {
	const card = await prisma.projectCard.findFirst({ where: { id, userId } });
	if (!card) throw httpError(404, "Card não encontrado.");
	return card;
}

async function createCard(userId, input) {
	const project = await prisma.userLead.findUnique({ where: { userId_leadId: { userId, leadId: input.leadId } } });
	if (project?.status !== "CLOSED") throw httpError(400, "O projeto precisa ser um lead fechado da sua lista.");
	const last = await prisma.projectCard.findFirst({
		where: { userId, column: input.column },
		orderBy: { position: "desc" },
	});
	return prisma.projectCard.create({ data: { ...input, userId, position: (last?.position ?? 0) + 1 } });
}

async function updateCard(userId, id, change) {
	await findCard(userId, id);
	return prisma.projectCard.update({ where: { id }, data: change });
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
	await removeImage(card.imageUrl);
}

/** Converte a imagem para WebP (até 1600px), guarda no Blob (ou em disco em dev) e troca a capa do card. */
async function setCardImage(userId, id, buffer) {
	const card = await findCard(userId, id);
	let webp;
	try {
		webp = await sharp(buffer).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
	} catch {
		throw httpError(400, "Imagem inválida.");
	}
	const name = `${randomUUID()}.webp`;
	let imageUrl;
	if (useBlob()) {
		const blob = await put(`board/${userId}/${name}`, webp, { access: "public", contentType: "image/webp" });
		imageUrl = blob.url;
	} else {
		await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
		await writeFile(path.join(LOCAL_UPLOADS_DIR, name), webp);
		imageUrl = `/uploads/${name}`;
	}
	const updated = await prisma.projectCard.update({ where: { id }, data: { imageUrl } });
	await removeImage(card.imageUrl);
	return updated;
}

async function deleteCardImage(userId, id) {
	const card = await findCard(userId, id);
	const updated = await prisma.projectCard.update({ where: { id }, data: { imageUrl: null } });
	await removeImage(card.imageUrl);
	return updated;
}

export { getBoard, createCard, updateCard, deleteCard, setCardImage, deleteCardImage };
