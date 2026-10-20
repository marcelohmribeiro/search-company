import { getUsage } from "#src/services";
import { googleApiKeySchema } from "#src/schemas";
import { fingerprint } from "#src/utils";

const UsageController = () => {
  async function show(req, res, next) {
    try {
      // A chave é opcional: com ela, o uso inclui o que outras contas fizeram com a mesma chave.
      const header = req.get("X-Google-Api-Key");
      const keyHash = header ? fingerprint(googleApiKeySchema.parse(header)) : undefined;
      const data = await getUsage(req.user.id, keyHash);

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
