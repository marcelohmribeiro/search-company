import { api } from './_api'
import type { Usage } from 'src/types'

export async function fetchUsage() {
	const { data } = await api.get<Usage>('/usage')
	return data
}
