import { randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";
import { httpError } from "#src/utils";

const DAY_MS = 24 * 60 * 60_000;

/** Envio da mensagem principal + `dayOffset` do primeiro follow-up ainda não enviado, ou `null`. */
function nextFollowUpAt(blocks) {
	const messages = blocks.filter((block) => block.type === "message");
	const main = messages.find((block) => block.group === "main" && block.sentAt);
	const pending = messages.find((block) => block.group === "followup" && !block.sentAt);
	if (!main || !pending) return null;
	return new Date(new Date(main.sentAt).getTime() + pending.dayOffset * DAY_MS);
}

/** Dá `id` aos blocos e itens novos e mantém `sentAt` e `done` salvos quando a entrada os omite. */
function mergeBlocks(incoming, saved) {
	const savedById = new Map(saved.map((block) => [block.id, block]));
	const seen = new Set();
	return incoming.map((block) => {
		const id = block.id && !seen.has(block.id) ? block.id : randomUUID();
		seen.add(id);
		const previous = savedById.get(id);
		if (block.type === "message") {
			const sentAt = block.sentAt !== undefined ? block.sentAt : (previous?.sentAt ?? null);
			return { ...block, id, sentAt };
		}
		if (block.type === "checklist") {
			const savedItems = previous?.type === "checklist" ? previous.items : [];
			const items = block.items.map((item) => {
				const match = savedItems.find((saved) => (item.id ? saved.id === item.id : saved.text === item.text));
				return { id: item.id ?? match?.id ?? randomUUID(), text: item.text, done: item.done ?? match?.done ?? false };
			});
			return { ...block, id, items };
		}
		return { ...block, id };
	});
}

async function findUserLead(userId, leadId) {
	const row = await prisma.userLead.findUnique({
		where: { userId_leadId: { userId, leadId } },
		include: { pitch: true },
	});
	if (!row) throw httpError(404, "Empresa não encontrada na sua lista.");
	return row;
}

/** Pitch do lead na lista do usuário, ou `null`. Lança 404 se a empresa não está na lista. */
async function getPitch(userId, leadId) {
	const row = await findUserLead(userId, leadId);
	return row.pitch;
}

/** Cria ou substitui o pitch, preservando o que já foi enviado e marcado nos blocos de mesmo `id`. */
async function savePitch(userId, leadId, input) {
	const row = await findUserLead(userId, leadId);
	const blocks = mergeBlocks(input.blocks, row.pitch?.blocks ?? []);
	const data = { ...input, blocks, nextFollowUpAt: nextFollowUpAt(blocks) };
	return prisma.leadPitch.upsert({
		where: { userId_leadId: { userId, leadId } },
		create: { userId, leadId, ...data },
		update: data,
	});
}

/** Marca uma mensagem como enviada (ou não) ou um item do checklist como feito. */
async function updatePitchBlock(userId, leadId, blockId, change) {
	const { pitch } = await findUserLead(userId, leadId);
	const block = pitch?.blocks.find((item) => item.id === blockId);
	if (!block) throw httpError(404, "Bloco não encontrado.");

	if ("sent" in change) {
		if (block.type !== "message") throw httpError(400, "Só mensagens podem ser marcadas como enviadas.");
		block.sentAt = change.sent ? new Date().toISOString() : null;
	} else {
		const item = block.type === "checklist" && block.items.find((entry) => entry.id === change.itemId);
		if (!item) throw httpError(404, "Item não encontrado.");
		item.done = change.done;
	}

	return prisma.leadPitch.update({
		where: { userId_leadId: { userId, leadId } },
		data: { blocks: pitch.blocks, nextFollowUpAt: nextFollowUpAt(pitch.blocks) },
	});
}

/** Apaga o pitch. Lança 404 se não existe. */
async function deletePitch(userId, leadId) {
	await prisma.leadPitch.delete({ where: { userId_leadId: { userId, leadId } } });
}

export { getPitch, savePitch, updatePitchBlock, deletePitch };
