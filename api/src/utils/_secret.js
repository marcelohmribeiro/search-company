import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { settings } from "#src/config";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(settings.ENCRYPTION_KEY ?? "", "hex");

// Sem a chave, as chaves do Google salvas não poderiam ser lidas; melhor a API nem subir.
if (KEY.length !== 32) {
	throw new Error("ENCRYPTION_KEY precisa ter 64 caracteres hexadecimais no api/.env.");
}

/**
 * Cifra um texto com AES-256-GCM, que também detecta qualquer alteração no valor guardado.
 * @returns {string} "iv:tag:cifrado", em hexadecimal.
 */
function encrypt(text) {
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGORITHM, KEY, iv);
	const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
	return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("hex")).join(":");
}

/**
 * Decifra o que `encrypt` gerou.
 * @throws Com outra `ENCRYPTION_KEY` ou com o valor alterado.
 */
function decrypt(stored) {
	const [iv, tag, encrypted] = stored.split(":").map((part) => Buffer.from(part, "hex"));
	const decipher = createDecipheriv(ALGORITHM, KEY, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/** SHA-256 em hexadecimal: reconhece o mesmo valor sem guardá-lo. */
function fingerprint(text) {
	return createHash("sha256").update(text).digest("hex");
}

export { encrypt, decrypt, fingerprint };
