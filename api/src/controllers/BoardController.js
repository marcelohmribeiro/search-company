import { createCard, deleteCard, deleteCardImage, getBoard, setCardImage, updateCard } from "#src/services";
import { cardCreateSchema, cardUpdateSchema } from "#src/schemas";
import { httpError } from "#src/utils";

const cardId = (req) => {
	const id = Number(req.params.id);
	if (!Number.isInteger(id)) throw httpError(404, "Card não encontrado.");
	return id;
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
		uploadImage: handle((req) => {
			if (!Buffer.isBuffer(req.body) || !req.body.length) throw httpError(400, "Envie uma imagem JPG, PNG ou WebP de até 5 MB.");
			return setCardImage(req.user.id, cardId(req), req.body);
		}),
		removeImage: handle((req) => deleteCardImage(req.user.id, cardId(req))),
	};
};

export { BoardController };
export default BoardController;
