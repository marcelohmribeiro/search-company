import { Router } from "express";
import { LeadController } from "#src/controllers";
import { verifyJWTOrApiToken } from "#src/middlewares";

const LeadRouter = Router();
const { findAll, filterOptions, update } = LeadController();

// Também aceitam token pessoal, para o Claude ler os leads e atualizar status e anotações.
LeadRouter.get("/", verifyJWTOrApiToken, findAll);
LeadRouter.get("/filters", verifyJWTOrApiToken, filterOptions);
LeadRouter.patch("/:id", verifyJWTOrApiToken, update);

export { LeadRouter };
export default LeadRouter;
