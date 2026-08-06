import { backendApi } from '../lib/axios'
import type {
  CreateProjectRequest, CreateProjectResponse,
  GetProjectsParams, GetProjectsResponse,
  GetProjectResponse,
  UpdateProjectRequest, UpdateProjectResponse,
  SetProjectFavoriteRequest, SetProjectFavoriteResponse,
  SetProjectInstructionRequest, SetProjectInstructionResponse,
  GetProjectSessionsParams, GetProjectSessionsResponse,
} from '../../types/project'

// 새 프로젝트 워크스페이스 생성
export const createProject = (data: CreateProjectRequest) =>
  backendApi.post<CreateProjectResponse>('/api/v1/projects', data)

// 프로젝트 목록 (커서 기반). is_favorite=true면 즐겨찾기만.
export const getProjects = (params?: GetProjectsParams) =>
  backendApi.get<GetProjectsResponse>('/api/v1/projects', {
    params: { size: 20, ...params },
  })

// 프로젝트 상세 (지침 포함)
export const getProject = (projectId: string) =>
  backendApi.get<GetProjectResponse>(`/api/v1/projects/${projectId}`)

// 프로젝트 제목 수정
export const updateProject = (projectId: string, data: UpdateProjectRequest) =>
  backendApi.patch<UpdateProjectResponse>(`/api/v1/projects/${projectId}`, data)

// 프로젝트 즐겨찾기 설정 (updated_at 정렬에 영향 없음)
export const setProjectFavorite = (projectId: string, data: SetProjectFavoriteRequest) =>
  backendApi.patch<SetProjectFavoriteResponse>(`/api/v1/projects/${projectId}/favorite`, data)

// 프로젝트 지침 설정/수정 (null·빈 문자열이면 지침 삭제)
export const setProjectInstruction = (projectId: string, data: SetProjectInstructionRequest) =>
  backendApi.patch<SetProjectInstructionResponse>(`/api/v1/projects/${projectId}/instruction`, data)

// 프로젝트 하위 대화 세션 목록 (커서 기반)
export const getProjectSessions = (projectId: string, params?: GetProjectSessionsParams) =>
  backendApi.get<GetProjectSessionsResponse>(`/api/v1/projects/${projectId}/sessions`, {
    params: { size: 20, ...params },
  })
