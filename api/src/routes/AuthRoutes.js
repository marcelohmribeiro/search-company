import { Router } from "express";
import { AuthController } from "#src/controllers";

const AuthRouter = Router();
const { login, register } = AuthController();

AuthRouter.post("/login", login);
AuthRouter.post("/register", register);

export { AuthRouter };
export default AuthRouter;
