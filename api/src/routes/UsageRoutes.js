import { Router } from "express";
import { UsageController } from "#src/controllers";

const UsageRouter = Router();
const { show } = UsageController();

UsageRouter.get("/", show);

export { UsageRouter };
export default UsageRouter;
