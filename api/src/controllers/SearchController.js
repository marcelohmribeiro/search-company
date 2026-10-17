import { runSearch, listSearches } from "#src/services";
import { searchInputSchema, googleApiKeySchema } from "#src/schemas";

const SearchController = () => {
  async function create(req, res, next) {
    try {
      const input = searchInputSchema.parse(req.body ?? {});
      const apiKey = googleApiKeySchema.parse(req.get("X-Google-Api-Key"));
      const data = await runSearch(input, apiKey);

      return res.status(data.skipped ? 200 : 201).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function findAll(req, res, next) {
    try {
      const data = await listSearches();

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
