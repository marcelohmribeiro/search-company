import { createHash } from "node:crypto";

/** SHA-256 do texto, em hexadecimal. */
function fingerprint(text) {
	return createHash("sha256").update(text).digest("hex");
}

export { fingerprint };
