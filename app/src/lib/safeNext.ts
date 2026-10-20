/** Só aceita caminhos do próprio app, para o `next` da URL não mandar para outro site. */
export const safeNext = (next: string | null) => (next?.startsWith('/') && !next.startsWith('//') ? next : '/')

/** Mantém o `next` ao trocar entre o login e o cadastro. */
export const withNext = (path: string, next: string | null) => (next ? `${path}?next=${encodeURIComponent(next)}` : path)
