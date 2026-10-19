import { Router } from "express";
import { LeadController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const LeadRouter = Router();
const { findAll, filterOptions, update } = LeadController();

LeadRouter.get("/", verifyJWT, findAll);
LeadRouter.get("/filters", verifyJWT, filterOptions);
LeadRouter.patch("/:id", verifyJWT, update);

export { LeadRouter };
export default LeadRouter;
