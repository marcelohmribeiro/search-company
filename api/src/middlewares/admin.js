import { isAdmin } from "#src/services";
import { httpError } from "#src/utils";

/** Libera a rota só para administradores. Vem depois do `verifyJWT`. */
export async function requireAdmin(req, res, next) {
  try {
    if (!(await isAdmin(req.user.id))) throw httpError(403, "Só o administrador pode acessar esta área.");
    next();
  } catch (error) {
    next(error);
  }
}
