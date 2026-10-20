import { Router } from "express";
import { LeadController } from "#src/controllers";
import { verifyJWTOrApiToken } from "#src/middlewares";

const LeadRouter = Router();
const { findAll, filterOptions, update } = LeadController();

LeadRouter.get("/", verifyJWTOrApiToken, findAll);
LeadRouter.get("/filters", verifyJWTOrApiToken, filterOptions);
LeadRouter.patch("/:id", verifyJWTOrApiToken, update);

export { LeadRouter };
export default LeadRouter;
