import { getMe, recordAccess, saveGoogleApiKey, removeGoogleApiKey } from "#src/services";
import { googleApiKeySchema } from "#src/schemas";

const MeController = () => {
  // O front chama ao abrir o app: é assim que as entradas do usuário são registradas.
  async function show(req, res, next) {
    try {
      const data = await getMe(req.user.id);
      await recordAccess(req.user.id);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function saveGoogleKey(req, res, next) {
    try {
      const { apiKey } = googleApiKeySchema.parse(req.body ?? {});
      const data = await saveGoogleApiKey(req.user.id, apiKey);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function removeGoogleKey(req, res, next) {
    try {
      const data = await removeGoogleApiKey(req.user.id);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  return {
    show,
    saveGoogleKey,
    removeGoogleKey,
  };
};

export { MeController };
export default MeController;
