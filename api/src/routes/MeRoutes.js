import { Router } from "express";
import { MeController, ApiTokenController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const MeRouter = Router();
const { show, update } = MeController();
const { findAll, create, remove } = ApiTokenController();

MeRouter.get("/", verifyJWT, show);
MeRouter.patch("/", verifyJWT, update);
MeRouter.get("/tokens", verifyJWT, findAll);
MeRouter.post("/tokens", verifyJWT, create);
MeRouter.delete("/tokens/:id", verifyJWT, remove);

export { MeRouter };
export default MeRouter;
