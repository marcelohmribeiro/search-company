import { Router } from "express";
import { SearchController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const SearchRouter = Router();
const { create, findAll } = SearchController();

SearchRouter.get("/", verifyJWT, findAll);
SearchRouter.post("/", verifyJWT, create);

export { SearchRouter };
export default SearchRouter;
