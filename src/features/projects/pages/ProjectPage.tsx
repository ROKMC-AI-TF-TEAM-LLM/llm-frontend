import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChatStore } from '@/features/chat/store'
import type { ProjectChat, ProjectDocument as ProjectDocumentType } from '../types'
import { useProjectView, useUpdateProject, useToggleProjectFavorite, useSetProjectInstruction, useProjectSessions, useProjectDocuments, useUploadProjectDocument, useDeleteProjectDocument, useProjectDocumentStatus, useConfirmDeleteProject, useRetryProjectDocument, projectDocumentDeleteKey } from '../hooks'
import { useUpdateSession, useToggleFavorite as useToggleSessionFavorite, useConfirmDeleteSession } from '@/features/sessions/hooks'
import ChatInput from '@/features/chat/components/ChatInput'
import MessageList from '@/features/chat/components/MessageList'
import { showToast } from '@/shared/store/toastStore'
import {
  Block,
  ChatRow,
  EmptyFiles,
  FavStar,
  FilesModal,
  InstructionBody,
  InstructionModal,
  KebabMenu,
  Mark,
  ProjectDocRow,
  ProjectPath,
  UploadingDocRow,
} from '../components/parts'
import { NewChatIcon, PanelIcon, SparkIcon } from '../components/icons'
import { PlusIcon } from '@/shared/components/icons'
import Button from '@/shared/components/Button'
import IconButton from '@/shared/components/IconButton'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useMutationState, useQueryClient } from '@tanstack/react-query'
import { isNetworkError, readApiError } from '@/shared/utils/error'
import { SESSION_ERRORS } from '@/features/sessions/utils'
import { logError } from '@/shared/utils/logError'
import { AI_NOTICE } from '@/shared/constants'
import { formatClock } from '@/shared/utils/date'

function PollingDocRow({
  projectId,
  doc,
  onRetry,
  onDelete,
  deleting,
}: {
  projectId: string
  doc: ProjectDocumentType
  onRetry: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const inProgress = doc.status === 'pending' || doc.status === 'queued' || doc.status === 'running'
  const { data } = useProjectDocumentStatus(projectId, doc.document_id, inProgress)
  const liveStatus = data?.data?.data?.status ?? doc.status
  return (
    <ProjectDocRow
      doc={{ ...doc, status: liveStatus }}
      onRetry={onRetry}
      onDelete={onDelete}
      deleting={deleting}
    />
  )
}

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
  const [modalOpen, setModalOpen] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const openChatId = chatId ?? null
  const openProjectChat = (nextId: string) => navigate(`/projects/${id}/${nextId}`)
  const closeChat = () => navigate(`/projects/${id}`)
  const [panelOpen, setPanelOpen] = useState(true)

  const { data: docsData } = useProjectDocuments(id)
  const documents = docsData?.data?.data?.documents ?? []
  const { mutate: uploadDoc, isPending: isUploading, variables: uploadingFile } = useUploadProjectDocument(id ?? '')
  const { mutate: deleteDoc } = useDeleteProjectDocument(id ?? '')
  const { mutate: retryDoc } = useRetryProjectDocument(id ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 진행 중인 삭제를 뮤테이션 캐시에서 읽는다. 컴포넌트 state와 달리 페이지가 다시 마운트돼도 유지되고,
  // 여러 파일을 동시에 지워도 각 행이 자기 상태를 표시한다.
  const deletingIds = useMutationState({
    filters: { mutationKey: projectDocumentDeleteKey(id ?? ''), status: 'pending' },
    select: (m) => m.state.variables as string,
  })
  const isDeletingRow = (documentId: string) => deletingIds.includes(documentId)
  // 되돌릴 수 없으므로 프로젝트·대화 삭제와 같이 확인을 받는다.
  const handleDeleteDoc = (documentId: string) => {
    if (isDeletingRow(documentId)) return
    const name = documents.find((d) => d.document_id === documentId)?.name ?? '이 파일'
    const ok = window.confirm(
      `'${name}'을(를) 프로젝트에서 삭제하시겠습니까?\n\n이후 대화에서 이 파일을 참조하지 않으며 되돌릴 수 없습니다.`,
    )
    if (ok) deleteDoc(documentId)
  }

  const MAX_UPLOAD = 50 * 1024 * 1024
  const ALLOWED_EXT = ['md', 'txt', 'pdf']
  const tryUpload = (file: File): boolean => {
    if (!id) return false
    if (isUploading) {
      showToast('이전 파일을 업로드하는 중입니다. 완료 후 다시 시도해주세요.')
      return false
    }
    // accept 속성은 파일 선택 창의 '모든 파일'로 우회되므로 직접 확인한다.
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
    if (!ALLOWED_EXT.includes(ext)) {
      showToast(`'${file.name}' 지원하지 않는 형식입니다. (.md, .txt, .pdf)`)
      return false
    }
    if (file.size > MAX_UPLOAD) {
      showToast(`'${file.name}' 50MB를 초과하여 업로드할 수 없습니다.`)
      return false
    }
    if (file.size === 0) {
      showToast(`'${file.name}' 빈 파일은 업로드할 수 없습니다.`)
      return false
    }
    uploadDoc(file)
    return true
  }
  const handlePickFile = () => {
    if (isUploading) {
      showToast('이전 파일을 업로드하는 중입니다. 완료 후 다시 시도해주세요.')
      return
    }
    fileInputRef.current?.click()
  }
  const handleUploadFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) tryUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleRetryDoc = (documentId: string) => {
    retryDoc(documentId, {
      onError: (e) => {
        const { detail } = readApiError(e)
        window.alert(detail ?? '재시도에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      },
    })
  }

  const { data: sessionsData } = useProjectSessions(id)
  // 쿼리 캐시에서 파생한다. 로컬 state로 복사해두면 뮤테이션 후 refetch가
  // 낙관적 수정을 덮어써서 값이 되돌아갔다 다시 바뀌는 깜빡임이 생긴다.
  const chats: ProjectChat[] = useMemo(() => {
    if (!sessionsData) return []
    return sessionsData.pages
      .flatMap((p) => p.data.data.items)
      .map((s) => ({
        id: s.session_id,
        title: s.title,
        isFavorite: s.is_favorite,
        updatedAt: formatClock(s.updated_at),
        messageCount: 0,
      }))
  }, [sessionsData])
  const openChatTitle = chatId ? chats.find((c) => c.id === chatId)?.title : undefined
  // ChatPage와 같이 대화를 열면 탭 제목을 대화 제목으로 바꾼다.
  useDocumentTitle(openChatTitle ?? (project ? project.name : '프로젝트'))

  const { mutate: updateSessionApi } = useUpdateSession()
  const { mutate: toggleSessionFavoriteApi } = useToggleSessionFavorite()
  const confirmDeleteChat = useConfirmDeleteSession()

  const renameChat = (targetId: string, next: string) => {
    updateSessionApi({ sessionId: targetId, data: { title: next } })
  }
  const toggleChatFavorite = (targetId: string) => {
    const cur = chats.find((c) => c.id === targetId)
    toggleSessionFavoriteApi({ sessionId: targetId, next: !(cur?.isFavorite ?? false) })
  }
  const deleteChat = (targetId: string) => {
    // 확인 창, 열려 있던 대화면 프로젝트 첫 화면으로 이동, 실패 알림은 훅이 맡는다.
    const target = chats.find((c) => c.id === targetId)
    confirmDeleteChat({ id: targetId, title: target?.title, projectId: id })
  }

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
          <Block
            icon={<SparkIcon className="h-4 w-4" />}
            title="지침"
            action={
              <IconButton label="지침 편집" onClick={() => setModalOpen(true)}>
                <PlusIcon className="h-4 w-4" strokeWidth={2.2} />
              </IconButton>
            }
          >
            <InstructionBody text={project.instructions} onEdit={() => setModalOpen(true)} clamp={6} />
          </Block>

          <Block
            title={`파일 ${documents.length}`}
            action={
              <IconButton label="파일 업로드" onClick={handlePickFile}>
                <PlusIcon className="h-4 w-4" strokeWidth={2.2} />
              </IconButton>
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.pdf"
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
            {documents.length === 0 && !isUploading ? (
              <button type="button" onClick={handlePickFile} className="w-full text-left">
                <EmptyFiles />
              </button>
            ) : (
              <div className="-mx-2">
                {isUploading && uploadingFile && (
                  <UploadingDocRow name={uploadingFile.name} size={uploadingFile.size} />
                )}
                {documents.map((d) => (
                  <PollingDocRow
                    key={d.document_id}
                    projectId={id ?? ''}
                    doc={d}
                    onRetry={() => handleRetryDoc(d.document_id)}
                    onDelete={() => handleDeleteDoc(d.document_id)}
                    deleting={isDeletingRow(d.document_id)}
                  />
                ))}
              </div>
            )}
          </Block>

          <Block
            title={`대화 ${chats.length}`}
            action={
              <IconButton label="이 프로젝트에서 새 채팅" onClick={closeChat}>
                <NewChatIcon className="h-4 w-4" />
              </IconButton>
            }
          >
            <div className="-mx-2">
              {chats.map((c) => (
                <ChatRow
                  key={c.id}
                  chat={c}
                  active={c.id === openChatId}
                  onClick={() => openProjectChat(c.id)}
                  onToggleFavorite={() => toggleChatFavorite(c.id)}
                  onRename={(next) => renameChat(c.id, next)}
                  onDelete={() => deleteChat(c.id)}
                />
              ))}
              {chats.length === 0 && (
                <p className="py-6 text-center text-[12.5px] text-text-muted">아직 대화가 없습니다.</p>
              )}
            </div>
          </Block>
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

        {openChatId && activeConnectError ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6">
            <p className="text-text-secondary">{activeConnectError}</p>
            <Button variant="link" onClick={retryConnect}>
              다시 시도
            </Button>
          </div>
        ) : openChatId ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 min-h-0">
              <MessageList title={project.name} isLoading={isConnecting} hideHeader />
            </div>
            <div className="shrink-0 bg-surface px-4 pb-2">
              <ChatInput isConnecting={isConnecting} hideDomain />
              <p className="text-xs text-center text-text-muted pt-2">{AI_NOTICE}</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
            <div className="w-full max-w-[720px] animate-page-in">
              <p className="mb-6 text-center text-[14px] text-text-muted">
                MARS는 이 프로젝트에서 대화할 때마다 동일한 지침과 파일을 참조합니다.
              </p>
              <ChatInput projectId={project.id} hideDomain notice={AI_NOTICE} />
            </div>
          </div>
        )}
      </div>

      <InstructionModal
        open={modalOpen}
        initial={project.instructions}
        onClose={() => setModalOpen(false)}
        onSave={(instructions) => setInstructionApi({ projectId: project.id, instructions })}
      />
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
