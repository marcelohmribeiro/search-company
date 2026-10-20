import type { UserRole } from './auth'
import type { Usage } from './search'

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

/** Aberturas com menos de 30 minutos entre si contam como uma entrada. */
export interface UserAccess {
	id: number
	startedAt: string
	lastSeenAt: string
}
