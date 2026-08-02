import { create } from 'zustand'
import { MOCK_PROJECTS, type Project } from './mock'

// 프로젝트 목록의 단일 진실. 사이드바 두 섹션(즐겨찾기 / 프로젝트)과 프로젝트 화면이
// 같은 목록을 보고 있어야 이름 변경·즐겨찾기·삭제가 서로 어긋나지 않는다.
//
// TODO(API): 서버 연결 시 이 스토어를 react-query로 대체하거나,
//            아래 액션들을 mutation 호출로 바꾼다(낙관적 업데이트는 여기서 유지).
interface ProjectState {
  projects: Project[]
  toggleFavorite: (id: string) => void
  rename: (id: string, next: string) => void
  remove: (id: string) => void
  /** 새 프로젝트를 만들고 그 id를 돌려준다(만든 뒤 곧바로 이동하기 위해). */
  create: (name: string, instructions: string) => string
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: MOCK_PROJECTS,

  toggleFavorite: (id) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)),
    })),

  rename: (id, next) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, name: next } : p)),
    })),

  remove: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  create: (name, instructions) => {
    const id = `p-new-${Date.now()}`
    const fresh: Project = {
      id,
      name,
      description: '',
      instructions,
      initial: name.trim().charAt(0) || '새',
      domain: '미지정',
      updatedAt: '지금',
      order: 0,
      isFavorite: false,
      files: [],
      chats: [],
    }
    set((s) => ({ projects: [fresh, ...s.projects] }))
    return id
  },
}))
