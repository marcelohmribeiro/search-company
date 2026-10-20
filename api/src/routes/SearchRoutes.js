import { Router } from "express";
import { SearchController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const SearchRouter = Router();
const { create, findAll, leads } = SearchController();

SearchRouter.get("/", verifyJWT, findAll);
SearchRouter.post("/", verifyJWT, create);
SearchRouter.get("/:id/leads", verifyJWT, leads);

export { SearchRouter };
export default SearchRouter;
