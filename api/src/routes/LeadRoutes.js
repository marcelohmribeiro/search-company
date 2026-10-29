import { Router } from "express";
import { LeadController, PitchController } from "#src/controllers";
import { verifyJWTOrApiToken } from "#src/middlewares";

const LeadRouter = Router();
const { findAll, filterOptions, show, update } = LeadController();
const pitch = PitchController();

LeadRouter.get("/", verifyJWTOrApiToken, findAll);
LeadRouter.get("/filters", verifyJWTOrApiToken, filterOptions);
LeadRouter.get("/:id", verifyJWTOrApiToken, show);
LeadRouter.patch("/:id", verifyJWTOrApiToken, update);
LeadRouter.get("/:id/pitch", verifyJWTOrApiToken, pitch.show);
LeadRouter.put("/:id/pitch", verifyJWTOrApiToken, pitch.save);
LeadRouter.delete("/:id/pitch", verifyJWTOrApiToken, pitch.remove);
LeadRouter.patch("/:id/pitch/blocks/:blockId", verifyJWTOrApiToken, pitch.updateBlock);

export { LeadRouter };
export default LeadRouter;
