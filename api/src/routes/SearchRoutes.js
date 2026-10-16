import { Router } from "express";
import { SearchController } from "#src/controllers";

const SearchRouter = Router();
const { create, findAll } = SearchController();

SearchRouter.get("/", findAll);
SearchRouter.post("/", create);

export { SearchRouter };
export default SearchRouter;
