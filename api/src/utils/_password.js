import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/**
 * Hash da senha com scrypt e salt aleatório, no formato "salt:hash" em hexadecimal.
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
	const salt = randomBytes(16).toString("hex");
	const hash = await scryptAsync(password, salt, KEY_LENGTH);
	return `${salt}:${hash.toString("hex")}`;
}

/**
 * Confere a senha com um hash gerado por `hashPassword`. A comparação leva o mesmo tempo com qualquer senha.
 * @param {string} password
 * @param {string} stored Valor de `User.passwordHash`.
 * @returns {Promise<boolean>} `false` também quando `stored` não está no formato esperado.
 */
async function verifyPassword(password, stored) {
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) return false;
	const expected = Buffer.from(hash, "hex");
	const actual = await scryptAsync(password, salt, expected.length);
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export { hashPassword, verifyPassword };
