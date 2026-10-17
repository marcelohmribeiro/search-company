import { Router } from "express";
import { LeadController } from "#src/controllers";

const LeadRouter = Router();
const { findAll, filterOptions, update } = LeadController();

LeadRouter.get("/", findAll);
LeadRouter.get("/filters", filterOptions);
LeadRouter.patch("/:id", update);

export { LeadRouter };
export default LeadRouter;
