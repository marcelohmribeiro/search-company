import { getMe, updateMe, recordAccess } from "#src/services";
import { meUpdateSchema } from "#src/schemas";

const MeController = () => {
  async function show(req, res, next) {
    try {
      const data = await getMe(req.user.id);
      await recordAccess(req.user.id);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function update(req, res, next) {
    try {
      const data = await updateMe(req.user.id, meUpdateSchema.parse(req.body ?? {}));

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  return {
    show,
    update,
  };
};

export { MeController };
export default MeController;
