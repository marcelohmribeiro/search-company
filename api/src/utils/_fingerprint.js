import { createHash } from "node:crypto";

/** SHA-256 em hexadecimal: reconhece o mesmo valor sem guardá-lo. */
function fingerprint(text) {
	return createHash("sha256").update(text).digest("hex");
}

export { fingerprint };
