import { getUsage } from "#src/services";
import { googleApiKeySchema } from "#src/schemas";

const UsageController = () => {
  async function show(req, res, next) {
    try {
      const apiKey = googleApiKeySchema.optional().parse(req.get("X-Google-Api-Key"));
      const data = await getUsage(req.user.id, apiKey);

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
