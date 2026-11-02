import { Router } from "express";
import { SearchController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const SearchRouter = Router();
const { create, findAll, leads, remove } = SearchController();

SearchRouter.get("/", verifyJWT, findAll);
SearchRouter.post("/", verifyJWT, create);
SearchRouter.get("/:id/leads", verifyJWT, leads);
SearchRouter.delete("/:id", verifyJWT, remove);

export { SearchRouter };
export default SearchRouter;
