import { Router } from "express";
import { LeadController } from "#src/controllers";

const LeadRouter = Router();
const { findAll, filterOptions, update, exportCsv } = LeadController();

LeadRouter.get("/", findAll);
LeadRouter.get("/filters", filterOptions);
LeadRouter.get("/export.csv", exportCsv);
LeadRouter.patch("/:id", update);

export { LeadRouter };
export default LeadRouter;
