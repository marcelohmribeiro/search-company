import { authenticate, register as registerUser } from "#src/services";
import { loginSchema, registerSchema } from "#src/schemas";

const AuthController = () => {
  async function login(req, res, next) {
    try {
      const data = await authenticate(loginSchema.parse(req.body ?? {}));

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async function register(req, res, next) {
    try {
      const data = await registerUser(registerSchema.parse(req.body ?? {}));

      return res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  return {
    login,
    register,
  };
};

export { AuthController };
export default AuthController;
