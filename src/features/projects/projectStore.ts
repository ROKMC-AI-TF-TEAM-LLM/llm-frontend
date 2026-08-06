import { create } from 'zustand'
import type { Project } from './mock'
import type { ProjectListItem, ProjectData } from '../../types/project'

// 프로젝트 목록의 단일 진실. 사이드바 두 섹션(즐겨찾기 / 프로젝트)과 프로젝트 화면이
// 같은 목록을 보고 있어야 이름 변경·즐겨찾기·삭제가 서로 어긋나지 않는다.
//
// 서버가 주는 값(project_id/title/is_favorite/instructions)만 실제 데이터이고,
// 파일·대화·도메인 등 화면 전용 필드는 아직 API가 없어 로컬 기본값으로 채운다.
// (그 필드들의 편집/추가는 이 스토어 안에서만 유지된다 — 새로고침하면 서버 값으로 리셋)

// 서버 목록/상세 항목 → 화면 모델(Project) 매핑.
// 목록 항목은 instructions가 없으므로 옵셔널로 받는다.
const toProject = (p: ProjectListItem | ProjectData): Project => {
  // 서버가 title/instructions를 null로 줄 수 있어 항상 문자열로 보정한다(UI에서 .trim() 등 호출).
  const title = p.title ?? ''
  const instructions = ('instructions' in p ? p.instructions : '') ?? ''
  return {
  id: p.project_id,
  name: title,
  isFavorite: p.is_favorite,
  instructions,
  // ── 아직 서버에 없는 화면 전용 필드(기본값) ──
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
  /** 서버 목록으로 스토어를 채운다(기존 로컬 편집분은 id 기준으로 보존). */
  setFromServer: (items: (ProjectListItem | ProjectData)[]) => void
  /** 상세 응답(지침 포함)을 반영한다. */
  upsertDetail: (data: ProjectData) => void
  toggleFavorite: (id: string) => void
  /** 즐겨찾기 값을 명시적으로 설정한다(서버 응답 반영·낙관적 업데이트용). */
  setFavorite: (id: string, next: boolean) => void
  rename: (id: string, next: string) => void
  setInstructions: (id: string, next: string) => void
  remove: (id: string) => void
  /** 생성 API 응답을 목록 맨 앞에 추가하고 그 id를 돌려준다. */
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
        // 로컬에만 있는 화면 전용 편집분(파일/대화/지침 등)은 유지하고, 서버 값(이름/즐겨찾기)은 갱신한다.
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
    // 이미 있으면(중복 방지) 그 id만 돌려준다.
    if (!get().projects.some((p) => p.id === fresh.id)) {
      set((s) => ({ projects: [fresh, ...s.projects] }))
    }
    return fresh.id
  },
}))
