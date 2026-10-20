import jwt from "jsonwebtoken";
import { settings } from "#src/config";
import { findApiTokenUser, isApiToken } from "#src/services";

/** Só a sessão do app (JWT do login). Um token pessoal recebe 401 aqui. */
export function verifyJWT(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Token não fornecido" });
  const tokenClean = token.split(' ')[1]
  try {
    const decoded = jwt.verify(tokenClean, settings.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

/**
 * Aceita a sessão do app ou um token pessoal (`sc_...`, de `POST /me/tokens`). Use só nas rotas que
 * ferramentas fora do app podem chamar (hoje, as de `/leads`); o resto continua com `verifyJWT`.
 */
export async function verifyJWTOrApiToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!isApiToken(token)) return verifyJWT(req, res, next);

  try {
    const userId = await findApiTokenUser(token);
    if (!userId) return res.status(401).json({ message: "Token inválido" });
    req.user = { id: userId };
    next();
  } catch (error) {
    next(error);
  }
}
