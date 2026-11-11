// 여러 기능이 함께 쓰는 React Query 캐시 키.
// 대화(세션) 목록은 전역 목록(['sessions', ...])과 프로젝트별 목록(['projects', 'sessions', id]) 두 캐시에 들어 있고,
// sessions·projects·chat이 같은 키를 고친다. 한 기능 안에서만 쓰는 키는 그 기능의 hooks에 둔다.
import type { QueryClient } from '@tanstack/react-query'

export const SESSIONS_KEY = ['sessions'] as const
export const SESSIONS_INFINITE_KEY = ['sessions', 'infinite'] as const
export const PROJECT_SESSIONS_KEY = ['projects', 'sessions'] as const
export const projectSessionsKey = (projectId: string | undefined) =>
  [...PROJECT_SESSIONS_KEY, projectId] as const

/** 세션 목록 캐시 두 곳(전역·프로젝트별)을 모두 다시 받게 한다 */
export const invalidateSessionLists = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: SESSIONS_KEY })
  qc.invalidateQueries({ queryKey: PROJECT_SESSIONS_KEY })
}

/** 낙관적 변경 전에, 진행 중인 세션 목록 요청(전역·프로젝트별)을 멈춘다 */
export const cancelSessionLists = async (qc: QueryClient) => {
  await qc.cancelQueries({ queryKey: SESSIONS_KEY })
  await qc.cancelQueries({ queryKey: PROJECT_SESSIONS_KEY })
}
