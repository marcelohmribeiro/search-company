/**
 * Cria um erro que o `handleError` devolve ao cliente com o status e a mensagem informados.
 * @param {number} status Status HTTP da resposta.
 * @param {string} message Mensagem exibida ao usuário.
 */
function httpError(status, message) {
	const error = new Error(message);
	error.status = status;
	return error;
}

export { httpError };
export default httpError;
