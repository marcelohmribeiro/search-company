export type PitchMessageGroup = 'main' | 'followup' | 'alternative'

export interface PitchMarkdownBlock {
	type: 'markdown'
	id: string
	title: string
	body: string
}

export interface PitchMessageBlock {
	type: 'message'
	id: string
	label: string
	group: PitchMessageGroup
	/** Dias depois do envio da mensagem principal. */
	dayOffset: number
	body: string
	sentAt: string | null
}

export interface PitchChecklistItem {
	id: string
	text: string
	done: boolean
}

export interface PitchChecklistBlock {
	type: 'checklist'
	id: string
	title: string
	items: PitchChecklistItem[]
}

export type PitchBlock = PitchMarkdownBlock | PitchMessageBlock | PitchChecklistBlock

export interface PitchHeader {
	demoUrl: string | null
	decisionMaker: string | null
	contactWhatsapp: string | null
	contactNotes: string | null
}

export interface Pitch extends PitchHeader {
	leadId: string
	blocks: PitchBlock[]
	nextFollowUpAt: string | null
	createdAt: string
	updatedAt: string
}

export type PitchInput = PitchHeader & { blocks: PitchBlock[] }

export type PitchFilter = '' | 'has' | 'none' | 'due'
