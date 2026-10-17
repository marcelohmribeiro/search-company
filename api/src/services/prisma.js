import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { settings } from "#src/config";

// Com `sslmode` na URL (Supabase), a conexão é criptografada sem validar o certificado, como no Prisma CLI.
// O `sslmode` sai da URL porque o `pg` trataria `require` como `verify-full` e recusaria a CA própria do Supabase.
const url = new URL(settings.DATABASE_URL);
const sslmode = url.searchParams.get("sslmode");
url.searchParams.delete("sslmode");

const adapter = new PrismaPg({
	connectionString: url.toString(),
	ssl: sslmode && sslmode !== "disable" ? { rejectUnauthorized: false } : undefined,
});
const prisma = new PrismaClient({ adapter });

export { prisma };
