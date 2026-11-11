import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useChatSession } from '@/features/chat/hooks'
import { SESSION_ERRORS } from '@/features/sessions/utils'
import IconButton from '@/shared/components/IconButton'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { showToast } from '@/shared/store/toastStore'
import {
  useProjectView,
  useUpdateProject,
  useToggleProjectFavorite,
  useSetProjectInstruction,
  useConfirmDeleteProject,
  useProjectFiles,
  useProjectChats,
} from '../hooks'
import { FavStar } from '../components/FavStar'
import { FilesModal } from '../components/FilesModal'
import { KebabMenu } from '../components/KebabMenu'
import { Mark } from '../components/Mark'
import { ProjectChatArea } from '../components/ProjectChatArea'
import { ProjectChatsBlock } from '../components/ProjectChatsBlock'
import { ProjectFilesBlock } from '../components/ProjectFilesBlock'
import { ProjectInstructionBlock } from '../components/ProjectInstructionBlock'
import { ProjectPath } from '../components/ProjectPath'
import { PanelIcon } from '../components/icons'
import { projectSessionsKey } from '@/lib/queryKeys'

export default function ProjectPage() {
  const { id, chatId } = useParams()
  const navigate = useNavigate()
  const {
    project,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useProjectView(id)
  const confirmDeleteProject = useConfirmDeleteProject()
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: toggleFavoriteApi } = useToggleProjectFavorite()
  const { mutate: setInstructionApi } = useSetProjectInstruction()
  const renameProject = (pid: string, next: string) =>
    updateProject({ projectId: pid, title: next })
  const toggleFavorite = (pid: string) =>
    toggleFavoriteApi({ projectId: pid, next: !(project?.isFavorite ?? false) })

  const queryClient = useQueryClient()
  const backToProject = () => navigate(`/projects/${id}`, { replace: true })
  const {
    isConnecting,
    connectError,
    retry: retryConnect,
  } = useChatSession(chatId, {
    knownErrors: SESSION_ERRORS.open,
    logLabel: 'ProjectPage.connect',
    logContext: { projectId: id, chatId },
    // 이미 삭제됐거나 접근할 수 없는 대화: 목록에서 걷어내고 프로젝트 첫 화면으로.
    onKnownError: (message) => {
      showToast(message)
      queryClient.invalidateQueries({ queryKey: projectSessionsKey(id) })
      backToProject()
    },
    onUnknownError: () => {
      showToast('대화를 불러오는 중 오류가 발생했습니다.')
      backToProject()
    },
    onDeleted: (message) => {
      if (message) showToast(message)
      backToProject()
    },
  })
  const activeConnectError = connectError?.message ?? null
  const [filesOpen, setFilesOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const openChatId = chatId ?? null
  const openProjectChat = (nextId: string) =>
    navigate(`/projects/${id}/${nextId}`)
  const closeChat = () => navigate(`/projects/${id}`)
  const [panelOpen, setPanelOpen] = useState(true)

  const files = useProjectFiles(id)
  const { documents, deletingIds, tryUpload, handleDeleteDoc, handleRetryDoc } =
    files

  const { chats, renameChat, toggleChatFavorite, deleteChat } =
    useProjectChats(id)
  const openChatTitle = chatId
    ? chats.find((c) => c.id === chatId)?.title
    : undefined
  // ChatPage와 같이 대화를 열면 탭 제목을 대화 제목으로 바꾼다.
  useDocumentTitle(openChatTitle ?? (project ? project.name : '프로젝트'))

  const submitRename = () => {
    const next = nameDraft.trim()
    if (project && next && next !== project.name)
      renameProject(project.id, next)
    setRenaming(false)
  }

  if (!project) {
    if (isDetailLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-surface-border border-t-brand" />
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <p className="text-15 font-semibold text-text-primary">
          {isDetailError
            ? '프로젝트에 접근할 수 없습니다.'
            : '프로젝트를 찾을 수 없습니다.'}
        </p>
        <p className="mt-1.5 text-13 text-text-secondary">
          삭제되었거나 주소가 잘못되었을 수 있습니다.
        </p>
      </div>
    )
  }

  const openChat = chats.find((c) => c.id === openChatId)

  return (
    <div className="flex h-full w-full bg-white">
      <aside
        style={{
          borderRightColor: panelOpen
            ? 'var(--color-rose-divider)'
            : 'transparent',
        }}
        className={`h-full shrink-0 overflow-hidden border-r transition-[width,border-color] duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] ${
          panelOpen ? 'w-[336px]' : 'w-0'
        }`}
      >
        <div
          className={`custom-scroll h-full w-[336px] overflow-y-auto px-4 pt-3.5 pb-6 transition-transform duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] ${
            panelOpen ? 'translate-x-0' : '-translate-x-[336px]'
          }`}
        >
          <div className="flex items-center gap-1 px-1">
            <Mark size={28} />
            {renaming ? (
              <input
                autoFocus
                spellCheck={false}
                value={nameDraft}
                maxLength={255}
                onChange={(e) => setNameDraft(e.target.value.slice(0, 255))}
                onBlur={submitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename()
                  if (e.key === 'Escape') setRenaming(false)
                }}
                className="ml-1 min-w-0 flex-1 rounded-[8px] border border-rose-border px-2 py-1 text-14 font-bold text-text-primary outline-none focus:border-brand"
              />
            ) : (
              <p className="ml-1 min-w-0 max-w-[136px] truncate text-14 font-bold text-text-primary">
                {project.name}
              </p>
            )}
            <FavStar
              active={project.isFavorite}
              onToggle={() => toggleFavorite(project.id)}
            />
            <KebabMenu
              onRename={() => {
                setNameDraft(project.name)
                setRenaming(true)
              }}
              onDelete={() =>
                confirmDeleteProject({ id: project.id, name: project.name })
              }
            />
            <span className="ml-auto">
              <IconButton
                label="컨텍스트 접기"
                onClick={() => setPanelOpen(false)}
              >
                <PanelIcon className="h-[17px] w-[17px]" />
              </IconButton>
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <ProjectInstructionBlock
              instructions={project.instructions}
              onSave={(instructions) =>
                setInstructionApi({ projectId: project.id, instructions })
              }
            />

            <ProjectFilesBlock projectId={id ?? ''} files={files} />

            <ProjectChatsBlock
              chats={chats}
              openChatId={openChatId}
              onOpen={openProjectChat}
              onNew={closeChat}
              onToggleFavorite={toggleChatFavorite}
              onRename={renameChat}
              onDelete={deleteChat}
            />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center px-5 py-3.5">
          <div
            className={`overflow-hidden transition-[max-width,opacity] duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] ${
              panelOpen ? 'max-w-0 opacity-0' : 'max-w-[40px] opacity-100'
            }`}
          >
            <IconButton
              label="컨텍스트 펴기"
              onClick={() => setPanelOpen(true)}
              disabled={panelOpen}
            >
              <PanelIcon className="h-[17px] w-[17px]" />
            </IconButton>
          </div>
          <div className="ml-3 min-w-0">
            <ProjectPath
              projectName={project.name}
              sessionTitle={openChat ? openChat.title : undefined}
            />
          </div>
        </header>

        <ProjectChatArea
          project={project}
          openChatId={openChatId}
          connectError={activeConnectError}
          onRetry={retryConnect}
          isConnecting={isConnecting}
        />
      </div>

      <FilesModal
        open={filesOpen}
        documents={documents}
        onClose={() => setFilesOpen(false)}
        onUpload={(file) => tryUpload(file)}
        onDelete={handleDeleteDoc}
        onRetry={handleRetryDoc}
        deletingIds={deletingIds}
      />
    </div>
  )
}
