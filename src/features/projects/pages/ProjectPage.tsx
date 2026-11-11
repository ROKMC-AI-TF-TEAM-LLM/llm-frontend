import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useChatStore } from '@/features/chat/store'
import { SESSION_ERRORS } from '@/features/sessions/utils'
import IconButton from '@/shared/components/IconButton'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { showToast } from '@/shared/store/toastStore'
import { isNetworkError, readApiError } from '@/shared/utils/error'
import { logError } from '@/shared/utils/logError'
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


export default function ProjectPage() {
  const { id, chatId } = useParams()
  const navigate = useNavigate()
  const { project, isLoading: isDetailLoading, isError: isDetailError } = useProjectView(id)
  const confirmDeleteProject = useConfirmDeleteProject()
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: toggleFavoriteApi } = useToggleProjectFavorite()
  const { mutate: setInstructionApi } = useSetProjectInstruction()
  const renameProject = (pid: string, next: string) => updateProject({ projectId: pid, title: next })
  const toggleFavorite = (pid: string) => toggleFavoriteApi({ projectId: pid, next: !(project?.isFavorite ?? false) })

  const queryClient = useQueryClient()
  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)
  const isConnecting = useChatStore((s) => s.isConnecting)
  const chatError = useChatStore((s) => s.error)
  const clearChatError = useChatStore((s) => s.clearError)
  const isDeleted = useChatStore((s) => s.isDeleted)
  const resetDeleted = useChatStore((s) => s.resetDeleted)

  // 일시적 오류(5xx·네트워크)는 ChatPage처럼 재시도 화면을 보여준다.
  // 어느 대화의 오류인지 함께 저장해, 다른 대화로 옮기면 자동으로 무시되게 한다.
  const [connectError, setConnectError] = useState<{ chatId: string; message: string } | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  // useLayoutEffect: 라우터 내비게이션은 트랜지션으로 커밋되므로 useEffect면
  // 이전 대화의 메시지가 한 프레임 그려질 수 있다. ChatPage와 동일하게 페인트 전에 연결한다.
  useLayoutEffect(() => {
    if (!chatId) {
      disconnect()
      return
    }
    let cancelled = false
    connect(chatId)
      .then(() => {
        if (!cancelled) setConnectError(null)
      })
      .catch((e) => {
        if (cancelled) return
        logError('ProjectPage.connect', e, { projectId: id, chatId })
        const { code, detail, status = 0 } = readApiError(e)
        const known = code ? (SESSION_ERRORS.project as Record<string, string>)[code] : undefined
        if (known) {
          // 이미 삭제됐거나 접근할 수 없는 대화: 목록에서 걷어내고 프로젝트 첫 화면으로.
          showToast(known)
          queryClient.invalidateQueries({ queryKey: ['projects', 'sessions', id] })
          navigate(`/projects/${id}`, { replace: true })
        } else if (status >= 500) {
          setConnectError({
            chatId,
            message: detail
              ? `서버에 일시적인 오류가 발생했습니다. (${status}: ${detail})`
              : `서버에 일시적인 오류가 발생했습니다. (${status})`,
          })
        } else if (isNetworkError(e)) {
          setConnectError({ chatId, message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.' })
        } else {
          showToast('대화를 불러오는 중 오류가 발생했습니다.')
          navigate(`/projects/${id}`, { replace: true })
        }
      })
    return () => {
      cancelled = true
    }
  }, [chatId, id, retryKey, connect, disconnect, navigate, queryClient])
  // 같은 대화로 돌아와 다시 연결 중일 때는 이전 오류를 숨긴다(성공하면 위 then에서 지워진다).
  const activeConnectError =
    connectError && connectError.chatId === chatId && !isConnecting ? connectError.message : null
  const retryConnect = () => {
    setConnectError(null)
    setRetryKey((k) => k + 1)
  }

  // ChatPage와 동일하게 스트림 오류·첫 응답 실패로 인한 세션 삭제를 처리한다.
  useEffect(() => {
    if (isDeleted) {
      const msg = chatError
      resetDeleted()
      clearChatError()
      if (msg) showToast(msg)
      navigate(`/projects/${id}`, { replace: true })
      return
    }
    if (chatError) {
      showToast(chatError)
      clearChatError()
    }
  }, [isDeleted, chatError, resetDeleted, clearChatError, navigate, id])
  const [filesOpen, setFilesOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const openChatId = chatId ?? null
  const openProjectChat = (nextId: string) => navigate(`/projects/${id}/${nextId}`)
  const closeChat = () => navigate(`/projects/${id}`)
  const [panelOpen, setPanelOpen] = useState(true)

  const files = useProjectFiles(id)
  const { documents, deletingIds, tryUpload, handleDeleteDoc, handleRetryDoc } = files

  const { chats, renameChat, toggleChatFavorite, deleteChat } = useProjectChats(id)
  const openChatTitle = chatId ? chats.find((c) => c.id === chatId)?.title : undefined
  // ChatPage와 같이 대화를 열면 탭 제목을 대화 제목으로 바꾼다.
  useDocumentTitle(openChatTitle ?? (project ? project.name : '프로젝트'))

  const submitRename = () => {
    const next = nameDraft.trim()
    if (project && next && next !== project.name) renameProject(project.id, next)
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
        <p className="text-[15px] font-semibold text-text-primary">
          {isDetailError ? '프로젝트에 접근할 수 없습니다.' : '프로젝트를 찾을 수 없습니다.'}
        </p>
        <p className="mt-1.5 text-[13px] text-text-secondary">
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
          borderRightColor: panelOpen ? '#f4eced' : 'transparent',
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
              className="ml-1 min-w-0 flex-1 rounded-[8px] border border-[#f0e6e8] px-2 py-1 text-[14px] font-bold text-text-primary outline-none focus:border-brand"
            />
          ) : (
            <p className="ml-1 min-w-0 max-w-[136px] truncate text-[14px] font-bold text-text-primary">
              {project.name}
            </p>
          )}
          <FavStar active={project.isFavorite} onToggle={() => toggleFavorite(project.id)} />
          <KebabMenu
            onRename={() => {
              setNameDraft(project.name)
              setRenaming(true)
            }}
            onDelete={() => confirmDeleteProject({ id: project.id, name: project.name })}
          />
          <span className="ml-auto">
            <IconButton label="컨텍스트 접기" onClick={() => setPanelOpen(false)}>
              <PanelIcon className="h-[17px] w-[17px]" />
            </IconButton>
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <ProjectInstructionBlock
            instructions={project.instructions}
            onSave={(instructions) => setInstructionApi({ projectId: project.id, instructions })}
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
            <ProjectPath projectName={project.name} sessionTitle={openChat ? openChat.title : undefined} />
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
