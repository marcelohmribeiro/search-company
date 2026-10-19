import { Router } from "express";
import { AdminController } from "#src/controllers";
import { verifyJWT, requireAdmin } from "#src/middlewares";

const AdminRouter = Router();
const { users, user, userLeads, userAccesses } = AdminController();

AdminRouter.get("/users", verifyJWT, requireAdmin, users);
AdminRouter.get("/users/:id", verifyJWT, requireAdmin, user);
AdminRouter.get("/users/:id/leads", verifyJWT, requireAdmin, userLeads);
AdminRouter.get("/users/:id/accesses", verifyJWT, requireAdmin, userAccesses);

export { AdminRouter };
export default AdminRouter;
