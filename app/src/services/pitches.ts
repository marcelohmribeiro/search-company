import { api } from './_api'
import type { Lead, Pitch, PitchInput } from 'src/types'

const pitchPath = (leadId: string) => `/leads/${encodeURIComponent(leadId)}/pitch`

export async function fetchLead(id: string) {
	const { data } = await api.get<Lead>(`/leads/${encodeURIComponent(id)}`)
	return data
}

/** Pitch do lead, ou `null` se ainda não existe. */
export async function fetchPitch(leadId: string) {
	const { data } = await api.get<Pitch | null>(pitchPath(leadId))
	return data || null
}

export async function savePitch(leadId: string, input: PitchInput) {
	const { data } = await api.put<Pitch>(pitchPath(leadId), input)
	return data
}

export async function deletePitch(leadId: string) {
	await api.delete(pitchPath(leadId))
}

export async function setPitchMessageSent(leadId: string, blockId: string, sent: boolean) {
	const { data } = await api.patch<Pitch>(`${pitchPath(leadId)}/blocks/${encodeURIComponent(blockId)}`, { sent })
	return data
}

export async function setPitchItemDone(leadId: string, blockId: string, itemId: string, done: boolean) {
	const { data } = await api.patch<Pitch>(`${pitchPath(leadId)}/blocks/${encodeURIComponent(blockId)}`, { itemId, done })
	return data
}
