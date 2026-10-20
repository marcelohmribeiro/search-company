import type { UserRole } from './auth'
import type { Usage } from './search'

/** Usuário com os números dele, no painel admin. */
export interface AdminUser {
	id: number
	username: string
	role: UserRole
	createdAt: string
	leadsCount: number
	searchesCount: number
	accessesCount: number
	lastAccessAt: string | null
	usage: Usage
}

/** Uma entrada no app. Aberturas com menos de 30 minutos de intervalo contam como a mesma entrada. */
export interface UserAccess {
	id: number
	startedAt: string
	lastSeenAt: string
}
