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

const proposalsPath = (cardId: number) => `/board/cards/${cardId}/proposals`

export async function addProposal(cardId: number, file: File, caption: string | null) {
	const { data } = await api.post<ProjectCard>(proposalsPath(cardId), file, {
		headers: { 'Content-Type': file.type },
		params: caption ? { caption } : undefined,
	})
	return data
}

export async function updateProposal(cardId: number, proposalId: number, change: { caption?: string | null; position?: number }) {
	const { data } = await api.patch<ProjectCard>(`${proposalsPath(cardId)}/${proposalId}`, change)
	return data
}

export async function deleteProposal(cardId: number, proposalId: number) {
	const { data } = await api.delete<ProjectCard>(`${proposalsPath(cardId)}/${proposalId}`)
	return data
}
