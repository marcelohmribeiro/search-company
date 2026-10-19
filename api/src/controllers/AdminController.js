import { listUsers, getUserSummary, listAccesses, listLeads } from "#src/services";
import { leadQuerySchema, userIdSchema } from "#src/schemas";

const AdminController = () => {
  async function users(req, res, next) {
    try {
      const data = await listUsers();

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function user(req, res, next) {
    try {
      const data = await getUserSummary(userIdSchema.parse(req.params.id));

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function userLeads(req, res, next) {
    try {
      const userId = userIdSchema.parse(req.params.id);
      const { page, pageSize, orderBy, ...filters } = leadQuerySchema.parse(req.query);
      const data = await listLeads(userId, filters, { page, pageSize, orderBy });

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function userAccesses(req, res, next) {
    try {
      const data = await listAccesses(userIdSchema.parse(req.params.id));

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  return {
    users,
    user,
    userLeads,
    userAccesses,
  };
};

export { AdminController };
export default AdminController;
