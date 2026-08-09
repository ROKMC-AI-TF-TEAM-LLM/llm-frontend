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

export const createProject = (data: CreateProjectRequest) =>
  backendApi.post<CreateProjectResponse>('/api/v1/projects', data)

export const getProjects = (params?: GetProjectsParams) =>
  backendApi.get<GetProjectsResponse>('/api/v1/projects', {
    params: { size: 20, ...params },
  })

export const getProject = (projectId: string) =>
  backendApi.get<GetProjectResponse>(`/api/v1/projects/${projectId}`)

export const updateProject = (projectId: string, data: UpdateProjectRequest) =>
  backendApi.patch<UpdateProjectResponse>(`/api/v1/projects/${projectId}`, data)

export const setProjectFavorite = (projectId: string, data: SetProjectFavoriteRequest) =>
  backendApi.patch<SetProjectFavoriteResponse>(`/api/v1/projects/${projectId}/favorite`, data)

export const setProjectInstruction = (projectId: string, data: SetProjectInstructionRequest) =>
  backendApi.patch<SetProjectInstructionResponse>(`/api/v1/projects/${projectId}/instruction`, data)

export const getProjectSessions = (projectId: string, params?: GetProjectSessionsParams) =>
  backendApi.get<GetProjectSessionsResponse>(`/api/v1/projects/${projectId}/sessions`, {
    params: { size: 20, ...params },
  })
