// Cadastra um usuário do app, ou troca a senha de um e-mail que já existe.
// Uso: bun run user:create [email] [--admin]
// Com --admin, o usuário criado (ou o existente) vira administrador; sem a opção, um usuário novo é comum e um
// existente mantém o papel.
// A senha é pedida no terminal sem aparecer na tela; com a entrada redirecionada, é lida da primeira linha.
import { createInterface } from "node:readline/promises";
import { settings } from "#src/config";
import { userSchema } from "#src/schemas";
import { prisma, saveUser } from "#src/services";

const { stdin, stdout } = process;

async function ask(question) {
	const rl = createInterface({ input: stdin, output: stdout });
	const answer = await rl.question(question);
	rl.close();
	return answer;
}

// Lê caractere por caractere em modo raw, para o que é digitado não aparecer no terminal.
function askHidden(question) {
	return new Promise((resolve) => {
		stdout.write(question);
		stdin.setRawMode(true);
		stdin.setEncoding("utf8");
		stdin.resume();

		let value = "";
		const onData = (chunk) => {
			for (const char of chunk) {
				if (char === "\r" || char === "\n" || char === "\u0004") {
					stdin.off("data", onData);
					stdin.setRawMode(false);
					stdin.pause();
					stdout.write("\n");
					return resolve(value);
				}
				if (char === "\u0003") {
					stdout.write("\n");
					process.exit(130);
				}
				value = char === "\u007f" || char === "\b" ? value.slice(0, -1) : value + char;
			}
		};
		stdin.on("data", onData);
	});
}

async function readPassword() {
	if (!stdin.isTTY) return ask("");

	const password = await askHidden("Senha: ");
	const confirmation = await askHidden("Repita a senha: ");
	if (password !== confirmation) throw new Error("As senhas não conferem.");
	return password;
}

async function main() {
	console.log(`Banco: ${new URL(settings.DATABASE_URL).host}`);

	const args = process.argv.slice(2);
	const role = args.includes("--admin") ? "ADMIN" : undefined;
	const email = args.find((arg) => !arg.startsWith("--")) ?? (await ask("E-mail: "));
	const password = await readPassword();

	const parsed = userSchema.safeParse({ email, password });
	if (!parsed.success) throw new Error(parsed.error.issues[0].message);

	const { user, created } = await saveUser({ ...parsed.data, role });
	const roleLabel = user.role === "ADMIN" ? "administrador" : "usuário comum";
	console.log(
		created
			? `Usuário criado: ${user.email} (id ${user.id}, ${roleLabel}).`
			: `Senha atualizada para ${user.email} (${roleLabel}).`,
	);
}

try {
	await main();
} catch (error) {
	console.error(`Erro: ${error.message}`);
	process.exitCode = 1;
} finally {
	await prisma.$disconnect();
}
