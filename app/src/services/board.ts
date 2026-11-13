import { api } from './_api'
import type { Board, BoardColumn, ProjectCard, ProjectCardInput } from 'src/types'

export async function fetchBoard() {
	const { data } = await api.get<Board>('/board')
	return data
}

export async function createCard(input: ProjectCardInput & { leadId: string; column: BoardColumn }) {
	const { data } = await api.post<ProjectCard>('/board/cards', input)
	return data
}

export async function updateCard(id: number, change: Partial<ProjectCardInput & { column: BoardColumn; position: number }>) {
	const { data } = await api.patch<ProjectCard>(`/board/cards/${id}`, change)
	return data
}

export async function deleteCard(id: number) {
	await api.delete(`/board/cards/${id}`)
}

export async function uploadCardImage(id: number, file: File) {
	const { data } = await api.put<ProjectCard>(`/board/cards/${id}/image`, file, { headers: { 'Content-Type': file.type } })
	return data
}

export async function deleteCardImage(id: number) {
	const { data } = await api.delete<ProjectCard>(`/board/cards/${id}/image`)
	return data
}
