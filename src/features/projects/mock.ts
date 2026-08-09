
export interface ProjectFile {
  id: string
  name: string
  ext: string
  size: string
  lines?: string
}

export interface ProjectChat {
  id: string
  title: string
  updatedAt: string
  messageCount: number
  isFavorite?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  instructions: string
  initial: string
  files: ProjectFile[]
  chats: ProjectChat[]
  updatedAt: string
  order: number
  isFavorite: boolean
  domain: string
}

