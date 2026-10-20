import { ZodError } from "zod";

const PRISMA_ERRORS = {
	P2002: [409, "Já existe um registro com esse valor."],
	P2003: [400, "Referência inválida."],
	P2025: [404, "Registro não encontrado."],
};

/** Primeiro problema da validação, no formato `"campo": mensagem`. */
function describeZodError(error) {
	const [issue] = error.issues;
	const field = issue.path.filter((part) => typeof part === "string").join(".");
	return field ? `"${field}": ${issue.message}` : issue.message;
}

/** Converte o erro em `{ error }` com o status HTTP. Erros não previstos viram 500 sem detalhes internos. */
function handleError(error, req, res, next) {
	console.error(`[${new Date().toISOString()}] Erro em ${req.method} ${req.originalUrl}`);
	console.error(error);

	if (error instanceof ZodError) return res.status(400).json({ error: describeZodError(error) });

	if (error.code?.startsWith("P")) {
		const [status, message] = PRISMA_ERRORS[error.code] ?? [500, "Erro ao acessar o banco de dados."];
		return res.status(status).json({ error: message });
	}

	return res.status(error.status || 500).json({ error: error.status ? error.message : "Erro interno do servidor" });
}

export { handleError };
export default handleError;
