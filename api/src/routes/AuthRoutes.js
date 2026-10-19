import { Router } from "express";
import { AuthController } from "#src/controllers";

const AuthRouter = Router();
const { login } = AuthController();

AuthRouter.post("/login", login);

export { AuthRouter };
export default AuthRouter;
