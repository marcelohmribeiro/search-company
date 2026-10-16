function csvCell(value) {
	if (value == null) return "";
	// O apóstrofo impede que o Excel interprete como fórmula um texto vindo do Google.
	const text = /^[=+\-@\t\r]/.test(String(value)) ? `'${value}` : String(value);
	return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Monta um CSV com `;` como separador, quebras de linha CRLF e BOM no início,
 * formato que o Excel em português abre com acentos e colunas corretos.
 * @param {[string, (row: any) => unknown][]} columns Pares de título e função que lê o valor da linha.
 * @param {any[]} rows
 * @returns {string} Só o cabeçalho quando `rows` está vazio.
 */
function buildCsv(columns, rows) {
	const header = columns.map(([title]) => csvCell(title)).join(";");
	const lines = rows.map((row) => columns.map(([, read]) => csvCell(read(row))).join(";"));
	return `﻿${[header, ...lines].join("\r\n")}\r\n`;
}

export { buildCsv };
export default buildCsv;
