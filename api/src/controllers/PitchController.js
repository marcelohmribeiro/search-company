import { getPitch, savePitch, updatePitchBlock, deletePitch } from "#src/services";
import { pitchInputSchema, pitchBlockUpdateSchema } from "#src/schemas";

const PitchController = () => {
  async function show(req, res, next) {
    try {
      const data = await getPitch(req.user.id, req.params.id);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function save(req, res, next) {
    try {
      const data = await savePitch(req.user.id, req.params.id, pitchInputSchema.parse(req.body ?? {}));

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function updateBlock(req, res, next) {
    try {
      const change = pitchBlockUpdateSchema.parse(req.body ?? {});
      const data = await updatePitchBlock(req.user.id, req.params.id, req.params.blockId, change);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function remove(req, res, next) {
    try {
      await deletePitch(req.user.id, req.params.id);

      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  return {
    show,
    save,
    updateBlock,
    remove,
  };
};

export { PitchController };
export default PitchController;
