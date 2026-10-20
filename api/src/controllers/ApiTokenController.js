import { listApiTokens, createApiToken, revokeApiToken } from "#src/services";
import { apiTokenInputSchema, apiTokenIdSchema } from "#src/schemas";

const ApiTokenController = () => {
  async function findAll(req, res, next) {
    try {
      const data = await listApiTokens(req.user.id);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function create(req, res, next) {
    try {
      const data = await createApiToken(req.user.id, apiTokenInputSchema.parse(req.body ?? {}));

      return res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function remove(req, res, next) {
    try {
      await revokeApiToken(req.user.id, apiTokenIdSchema.parse(req.params.id));

      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  return {
    findAll,
    create,
    remove,
  };
};

export { ApiTokenController };
export default ApiTokenController;
