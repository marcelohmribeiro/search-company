import { Router } from "express";
import { UsageController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const UsageRouter = Router();
const { show } = UsageController();

UsageRouter.get("/", verifyJWT, show);

export { UsageRouter };
export default UsageRouter;
