import { authenticate } from "#src/services";
import { loginSchema } from "#src/schemas";

const AuthController = () => {
  async function login(req, res, next) {
    try {
      const data = await authenticate(loginSchema.parse(req.body ?? {}));

      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  return {
    login,
  };
};

export { AuthController };
export default AuthController;
