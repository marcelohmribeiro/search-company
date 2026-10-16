function handleError(error, req, res, next) {
	console.error(`[${new Date().toISOString()}] Erro em ${req.method} ${req.originalUrl}`);
	console.error(error);

	// Prisma — erros conhecidos (foreign key, unique constraint, etc.)
	if (error.code?.startsWith("P")) {
		return handlePrismaError(error, res);
	}

	// Erro genérico não mapeado — nunca vaza detalhes internos pro cliente
	return res.status(error.status || 500).json({
		error: error.status ? error.message : "Erro interno do servidor",
	});
}

function handlePrismaError(error, res) {
	switch (error.code) {
		case "P2002": // unique constraint
			return res.status(409).json({
				error: `Já existe um registro com esse ${error.meta?.target?.join(", ") || "valor"}.`,
			});
		case "P2003": // foreign key constraint
			return res.status(400).json({ error: "Referência inválida — verifique os IDs informados." });
		case "P2025": // registro não encontrado (ex: update/delete de algo que não existe)
			return res.status(404).json({ error: "Registro não encontrado." });
		default:
			return res.status(500).json({ error: "Erro ao acessar o banco de dados." });
	}
}

export { handleError };
export default handleError;
