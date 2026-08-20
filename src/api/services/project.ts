import { backendApi } from '../lib/axios'
import type {
  CreateProjectRequest, CreateProjectResponse,
  GetProjectsParams, GetProjectsResponse,
  GetProjectResponse,
  UpdateProjectRequest, UpdateProjectResponse,
  SetProjectFavoriteRequest, SetProjectFavoriteResponse,
  SetProjectInstructionRequest, SetProjectInstructionResponse,
  GetProjectSessionsParams, GetProjectSessionsResponse,
  DeleteProjectResponse,
  UploadProjectDocumentResponse,
  GetProjectDocumentsParams, GetProjectDocumentsResponse,
  GetProjectDocumentStatusResponse,
  RetryProjectDocumentResponse,
  DeleteProjectDocumentResponse,
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

export const deleteProject = (projectId: string) =>
  backendApi.delete<DeleteProjectResponse>(`/api/v1/projects/${projectId}`)

export const getProjectSessions = (projectId: string, params?: GetProjectSessionsParams) =>
  backendApi.get<GetProjectSessionsResponse>(`/api/v1/projects/${projectId}/sessions`, {
    params: { size: 20, ...params },
  })

export const uploadProjectDocument = (projectId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return backendApi.post<UploadProjectDocumentResponse>(
    `/api/v1/projects/${projectId}/documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 },
  )
}

export const getProjectDocuments = (projectId: string, params?: GetProjectDocumentsParams) =>
  backendApi.get<GetProjectDocumentsResponse>(`/api/v1/projects/${projectId}/documents`, {
    params: { offset: 0, limit: 50, ...params },
  })

export const getProjectDocumentStatus = (projectId: string, documentId: string) =>
  backendApi.get<GetProjectDocumentStatusResponse>(
    `/api/v1/projects/${projectId}/documents/${documentId}/status`,
  )

export const retryProjectDocument = (projectId: string, documentId: string) =>
  backendApi.post<RetryProjectDocumentResponse>(
    `/api/v1/projects/${projectId}/documents/${documentId}/retry`,
  )

export const deleteProjectDocument = (projectId: string, documentId: string) =>
  backendApi.delete<DeleteProjectDocumentResponse>(
    `/api/v1/projects/${projectId}/documents/${documentId}`,
  )
