import { getUsage } from "#src/services";

const UsageController = () => {
  async function show(req, res, next) {
    try {
      const data = await getUsage();

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  return {
    show,
  };
};

export { UsageController };
export default UsageController;
