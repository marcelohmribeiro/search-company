/** Aceita só caminhos do próprio app. */
export const safeNext = (next: string | null) => (next?.startsWith('/') && !next.startsWith('//') ? next : '/')

export const withNext = (path: string, next: string | null) => (next ? `${path}?next=${encodeURIComponent(next)}` : path)
