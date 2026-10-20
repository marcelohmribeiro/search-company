import { Router } from "express";
import { MeController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const MeRouter = Router();
const { show } = MeController();

MeRouter.get("/", verifyJWT, show);

export { MeRouter };
export default MeRouter;
