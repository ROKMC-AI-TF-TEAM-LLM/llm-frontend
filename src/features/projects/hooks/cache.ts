// 프로젝트 캐시(React Query)의 키와, 목록·상세 캐시를 함께 고치는 도구. 훅은 projects.ts·documents.ts에 있다.
//
// 프로젝트 목록·상세의 단일 출처는 React Query 캐시다.
// (예전에는 zustand 스토어에 복사해 썼는데, 서버 응답이 올 때마다 스토어를 통째로 덮어써
//  낙관적 변경이 되돌아가거나 삭제한 프로젝트가 되살아나는 문제가 있었다.)
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import type {
  GetProjectsResponse,
  GetProjectResponse,
  ProjectData,
} from '../types'

export type ProjectsInfinite = InfiniteData<
  AxiosResponse<GetProjectsResponse>,
  string | undefined
>
export type ProjectDetail = AxiosResponse<GetProjectResponse>
export type Snapshot = [readonly unknown[], unknown]

export const PROJECTS_INFINITE_PREFIX = ['projects', 'infinite'] as const
export const PROJECTS_ALL_KEY = ['projects', 'infinite', 'all'] as const
export const projectDetailKey = (projectId: string | undefined) =>
  ['projects', 'detail', projectId] as const

// 프로젝트를 바꾸는 mutation은 모두 이 접두사를 쓴다.
// 여러 변경이 겹칠 때 마지막 것만 목록을 다시 받게 해, 중간 상태 응답이 화면을 되돌리지 않게 한다.
export const PROJECT_MUTATION_PREFIX = ['projects', 'mutate'] as const
export const PROJECT_DELETE_KEY = ['projects', 'mutate', 'delete'] as const

type ProjectPatch = Partial<
  Pick<ProjectData, 'title' | 'is_favorite' | 'instructions'>
>

// 목록(모든 infinite 쿼리)과 상세 캐시에 같은 변경을 적용하고, 롤백용 스냅샷을 돌려준다.
// patch가 null이면 목록에서 제거한다.
export const patchProjectCaches = (
  qc: QueryClient,
  projectId: string,
  patch: ProjectPatch | null,
): Snapshot[] => {
  const snapshots: Snapshot[] = []
  for (const [key, data] of qc.getQueriesData<ProjectsInfinite>({
    queryKey: PROJECTS_INFINITE_PREFIX,
  })) {
    if (!data) continue
    snapshots.push([key, data])
    qc.setQueryData<ProjectsInfinite>(key, {
      ...data,
      pages: data.pages.map((page) => {
        const items = page.data.data.items
        const nextItems = patch
          ? items.map((it) =>
              it.project_id === projectId
                ? {
                    ...it,
                    ...(patch.title !== undefined
                      ? { title: patch.title }
                      : {}),
                    ...(patch.is_favorite !== undefined
                      ? { is_favorite: patch.is_favorite }
                      : {}),
                  }
                : it,
            )
          : items.filter((it) => it.project_id !== projectId)
        return {
          ...page,
          data: { ...page.data, data: { ...page.data.data, items: nextItems } },
        }
      }),
    })
  }
  if (patch) {
    const key = projectDetailKey(projectId)
    const detail = qc.getQueryData<ProjectDetail>(key)
    if (detail?.data?.data) {
      snapshots.push([key, detail])
      qc.setQueryData<ProjectDetail>(key, {
        ...detail,
        data: { ...detail.data, data: { ...detail.data.data, ...patch } },
      })
    }
  }
  return snapshots
}

export const rollback = (
  qc: QueryClient,
  snapshots: Snapshot[] | undefined,
) => {
  if (!snapshots) return
  for (const [key, data] of snapshots) qc.setQueryData(key, data)
}

export const cancelProjectQueries = async (
  qc: QueryClient,
  projectId: string,
) => {
  await qc.cancelQueries({ queryKey: PROJECTS_INFINITE_PREFIX })
  await qc.cancelQueries({ queryKey: projectDetailKey(projectId) })
}

// 마지막으로 끝난 변경만 서버 값을 다시 받는다. 실패했으면(force) 항상 다시 받는다.
// onSettled 시점의 mutation은 아직 pending으로 집계되므로, 1이면 '내가 마지막'이다.
export const settleProjects = (qc: QueryClient, force = false) => {
  if (!force && qc.isMutating({ mutationKey: PROJECT_MUTATION_PREFIX }) > 1)
    return
  qc.invalidateQueries({ queryKey: PROJECTS_INFINITE_PREFIX })
  qc.invalidateQueries({ queryKey: ['projects', 'detail'] })
}

export const projectSessionsKey = (projectId: string | undefined) =>
  ['projects', 'sessions', projectId] as const
export const projectDocumentsKey = (projectId: string | undefined) =>
  ['projects', 'documents', projectId] as const
export const projectDocumentStatusKey = (
  projectId: string | undefined,
  documentId: string | undefined,
) => ['projects', 'documents', 'status', projectId, documentId] as const
