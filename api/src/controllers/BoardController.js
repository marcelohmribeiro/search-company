import {
	addProposal,
	createCard,
	deleteCard,
	deleteCardImage,
	deleteProposal,
	getBoard,
	setCardImage,
	updateCard,
	updateProposal,
} from "#src/services";
import { cardCreateSchema, cardUpdateSchema, proposalCreateSchema, proposalUpdateSchema } from "#src/schemas";
import { httpError } from "#src/utils";

const intParam = (value, message) => {
	const id = Number(value);
	if (!Number.isInteger(id)) throw httpError(404, message);
	return id;
};
const cardId = (req) => intParam(req.params.id, "Card não encontrado.");
const proposalId = (req) => intParam(req.params.proposalId, "Proposta não encontrada.");

const imageBody = (req) => {
	if (!Buffer.isBuffer(req.body) || !req.body.length) throw httpError(400, "Envie uma imagem JPG, PNG ou WebP de até 5 MB.");
	return req.body;
};

const BoardController = () => {
	const handle = (action, status = 200) => async (req, res, next) => {
		try {
			const data = await action(req);
			return status === 204 ? res.status(204).end() : res.status(status).json(data);
		} catch (error) {
			next(error);
		}
	};

	return {
		show: handle((req) => getBoard(req.user.id)),
		create: handle((req) => createCard(req.user.id, cardCreateSchema.parse(req.body ?? {})), 201),
		update: handle((req) => updateCard(req.user.id, cardId(req), cardUpdateSchema.parse(req.body ?? {}))),
		remove: handle((req) => deleteCard(req.user.id, cardId(req)), 204),
		uploadImage: handle((req) => setCardImage(req.user.id, cardId(req), imageBody(req))),
		removeImage: handle((req) => deleteCardImage(req.user.id, cardId(req))),
		addProposal: handle(
			(req) => addProposal(req.user.id, cardId(req), imageBody(req), proposalCreateSchema.parse(req.query ?? {}).caption),
			201,
		),
		updateProposal: handle((req) => updateProposal(req.user.id, cardId(req), proposalId(req), proposalUpdateSchema.parse(req.body ?? {}))),
		removeProposal: handle((req) => deleteProposal(req.user.id, cardId(req), proposalId(req))),
	};
};

export { BoardController };
export default BoardController;
