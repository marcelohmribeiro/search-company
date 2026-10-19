import { runSearch, listSearches } from "#src/services";
import { searchInputSchema } from "#src/schemas";

const SearchController = () => {
  async function create(req, res, next) {
    try {
      const data = await runSearch(req.user.id, searchInputSchema.parse(req.body ?? {}));

      return res.status(data.skipped ? 200 : 201).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function findAll(req, res, next) {
    try {
      const data = await listSearches(req.user.id);

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  return {
    create,
    findAll,
  };
};

export { SearchController };
export default SearchController;
