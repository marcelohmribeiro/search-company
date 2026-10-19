import jwt from "jsonwebtoken";
import { settings } from "#src/config";

// Sem segredo, nenhum token seria aceito; melhor a API nem subir.
if (!settings.JWT_SECRET) throw new Error("JWT_SECRET não está definido no api/.env.");

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
