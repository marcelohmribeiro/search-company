import { api } from './_api'
import type { AdminUser, LeadPage, UserAccess } from 'src/types'

export async function fetchAdminUsers() {
	const { data } = await api.get<AdminUser[]>('/admin/users')
	return data
}

export async function fetchAdminUser(id: number) {
	const { data } = await api.get<AdminUser>(`/admin/users/${id}`)
	return data
}

/** Empresas do usuário, as que entraram na lista dele mais recentemente primeiro, sem filtro. */
export async function fetchAdminUserLeads(id: number, page: number, pageSize: number) {
	const { data } = await api.get<LeadPage>(`/admin/users/${id}/leads`, { params: { page, pageSize, orderBy: 'recent' } })
	return data
}

export async function fetchAdminUserAccesses(id: number) {
	const { data } = await api.get<UserAccess[]>(`/admin/users/${id}/accesses`)
	return data
}
