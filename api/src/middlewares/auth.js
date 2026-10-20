import { findApiTokenUser, isApiToken, readSessionToken } from "#src/services";

function bearerToken(req) {
  return req.headers.authorization?.split(" ")[1];
}

/** Exige o JWT do login. Um token pessoal recebe 401. */
export function verifyJWT(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ message: "Token não fornecido" });

  const userId = readSessionToken(token);
  if (!userId) return res.status(401).json({ message: "Token inválido" });

  req.user = { id: userId };
  next();
}

/** Aceita o JWT do login ou um token pessoal (`sc_...`). Só para as rotas de `/leads`. */
export async function verifyJWTOrApiToken(req, res, next) {
  const token = bearerToken(req);
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
