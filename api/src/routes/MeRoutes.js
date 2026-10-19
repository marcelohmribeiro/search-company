import { Router } from "express";
import { MeController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const MeRouter = Router();
const { show, saveGoogleKey, removeGoogleKey } = MeController();

MeRouter.get("/", verifyJWT, show);
MeRouter.put("/google-api-key", verifyJWT, saveGoogleKey);
MeRouter.delete("/google-api-key", verifyJWT, removeGoogleKey);

export { MeRouter };
export default MeRouter;
