import jwt from "jsonwebtoken";
import { settings } from "#src/config";

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
