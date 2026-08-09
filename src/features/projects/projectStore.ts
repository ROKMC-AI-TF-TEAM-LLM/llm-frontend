import { create } from 'zustand'
import type { Project } from './mock'
import type { ProjectListItem, ProjectData } from '../../types/project'

const toProject = (p: ProjectListItem | ProjectData): Project => {
  const title = p.title ?? ''
  const instructions = ('instructions' in p ? p.instructions : '') ?? ''
  return {
  id: p.project_id,
  name: title,
  isFavorite: p.is_favorite,
  instructions,
  description: '',
  initial: title.trim().charAt(0) || '프',
  domain: '미지정',
  updatedAt: '',
  order: 0,
  files: [],
  chats: [],
  }
}

interface ProjectState {
  projects: Project[]
  setFromServer: (items: (ProjectListItem | ProjectData)[]) => void
  upsertDetail: (data: ProjectData) => void
  toggleFavorite: (id: string) => void
  setFavorite: (id: string, next: boolean) => void
  rename: (id: string, next: string) => void
  setInstructions: (id: string, next: string) => void
  remove: (id: string) => void
  addCreated: (data: ProjectData) => string
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],

  setFromServer: (items) =>
    set((s) => {
      const prevById = new Map(s.projects.map((p) => [p.id, p]))
      const merged = items.map((it) => {
        const base = toProject(it)
        const prev = prevById.get(base.id)
        return prev
          ? { ...prev, name: base.name, isFavorite: base.isFavorite }
          : base
      })
      return { projects: merged }
    }),

  upsertDetail: (data) =>
    set((s) => {
      const mapped = toProject(data)
      const exists = s.projects.some((p) => p.id === mapped.id)
      if (!exists) return { projects: [mapped, ...s.projects] }
      return {
        projects: s.projects.map((p) =>
          p.id === mapped.id
            ? { ...p, name: mapped.name, isFavorite: mapped.isFavorite, instructions: mapped.instructions }
            : p,
        ),
      }
    }),

  toggleFavorite: (id) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)),
    })),

  setFavorite: (id, next) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, isFavorite: next } : p)),
    })),

  rename: (id, next) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, name: next } : p)),
    })),

  setInstructions: (id, next) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, instructions: next } : p)),
    })),

  remove: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  addCreated: (data) => {
    const fresh = toProject(data)
    if (!get().projects.some((p) => p.id === fresh.id)) {
      set((s) => ({ projects: [fresh, ...s.projects] }))
    }
    return fresh.id
  },
}))
