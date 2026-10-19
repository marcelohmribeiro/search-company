import { prisma } from "#src/services";
import { httpError } from "#src/utils";

/**
 * Libera a rota só para ADMIN. Vem depois do `verifyJWT`. O papel é lido do banco a cada chamada,
 * para valer assim que mudar, sem esperar o token vencer.
 */
export async function requireAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
    if (user?.role !== "ADMIN") throw httpError(403, "Só o administrador pode acessar esta área.");
    next();
  } catch (error) {
    next(error);
  }
}
