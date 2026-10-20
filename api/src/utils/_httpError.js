/** Erro que o `handleError` devolve ao cliente com esse status e essa mensagem. */
function httpError(status, message) {
	const error = new Error(message);
	error.status = status;
	return error;
}

export { httpError };
export default httpError;
