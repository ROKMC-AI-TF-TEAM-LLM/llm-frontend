import { backendApi } from '../lib/axios'
import type {
  CreateProjectRequest, CreateProjectResponse,
  GetProjectsParams, GetProjectsResponse,
  GetProjectResponse,
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
