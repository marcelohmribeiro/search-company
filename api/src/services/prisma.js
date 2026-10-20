import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { settings } from "#src/config";

/** Tira o `sslmode` da URL e, se ele pedir SSL, conecta criptografado sem validar o certificado (CA do Supabase). */
function connectionOptions(databaseUrl) {
	const url = new URL(databaseUrl);
	const sslmode = url.searchParams.get("sslmode");
	url.searchParams.delete("sslmode");
	return {
		connectionString: url.toString(),
		ssl: sslmode && sslmode !== "disable" ? { rejectUnauthorized: false } : undefined,
	};
}

const prisma = new PrismaClient({ adapter: new PrismaPg(connectionOptions(settings.DATABASE_URL)) });

export { prisma };
