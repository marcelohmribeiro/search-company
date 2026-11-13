export type BoardColumn = 'BACKLOG' | 'PROPOSAL' | 'TODO' | 'REVIEW' | 'DONE'

/** Lead `CLOSED` da lista do usuário. */
export interface BoardProject {
	leadId: string
	name: string
}

/** Imagem de como a capa ("atual") deve ficar. */
export interface CardProposal {
	id: number
	url: string
	caption: string | null
	position: number
}

export interface ProjectCard {
	id: number
	leadId: string
	column: BoardColumn
	position: number
	title: string
	description: string | null
	imageUrl: string | null
	proposals: CardProposal[]
	createdAt: string
	updatedAt: string
}

export interface Board {
	projects: BoardProject[]
	cards: ProjectCard[]
}

export interface ProjectCardInput {
	title: string
	description: string | null
}
