import { getMe, recordAccess } from "#src/services";

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

  return {
    show,
  };
};

export { MeController };
export default MeController;
