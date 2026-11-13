export type BoardColumn = 'BACKLOG' | 'TODO' | 'REVIEW' | 'DONE'

/** Lead `CLOSED` da lista do usuário. */
export interface BoardProject {
	leadId: string
	name: string
}

export interface ProjectCard {
	id: number
	leadId: string
	column: BoardColumn
	position: number
	title: string
	description: string | null
	imageUrl: string | null
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
