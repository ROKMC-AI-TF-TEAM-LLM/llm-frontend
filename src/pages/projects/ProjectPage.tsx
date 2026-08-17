import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../../features/projects/projectStore'
import { useChatStore } from '../../api/store/chatStore'
import type { ProjectChat } from '../../features/projects/mock'
import { useProject, useUpdateProject, useToggleProjectFavorite, useSetProjectInstruction, useProjectSessions, useProjectDocuments, useUploadProjectDocument, useDeleteProjectDocument, useProjectDocumentStatus, useDeleteProject } from '../../hooks/useProject'
import { useUpdateSession, useToggleFavorite as useToggleSessionFavorite, useDeleteSession } from '../../hooks/useSession'
import type { ProjectDocument as ProjectDocumentType } from '../../types/project'
import ChatInput from '../../ui/components/chat/ChatInput'
import MessageList from '../../ui/components/messages/MessageList'
import {
  Block,
  ChatRow,
  EmptyFiles,
  FavStar,
  FilesModal,
  IconButton,
  InstructionBody,
  InstructionModal,
  KebabMenu,
  Mark,
  NewChatIcon,
  PanelIcon,
  PlusIcon,
  ProjectDocRow,
  ProjectPath,
  SparkIcon,
} from '../../features/projects/ui'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

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
  const pending = doc.status === 'queued' || doc.status === 'running'
  const { data } = useProjectDocumentStatus(projectId, doc.document_id, pending)
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

const formatTime = (iso?: string | null): string => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
}

export default function ProjectPage() {
  const { id, chatId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const { mutate: deleteProjectApi } = useDeleteProject()
  const upsertDetail = useProjectStore((s) => s.upsertDetail)
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: toggleFavoriteApi } = useToggleProjectFavorite()
  const { mutate: setInstructionApi } = useSetProjectInstruction()
  const renameProject = (pid: string, next: string) => updateProject({ projectId: pid, title: next })
  const toggleFavorite = (pid: string) => toggleFavoriteApi({ projectId: pid, next: !(project?.isFavorite ?? false) })

  const { data: detailData, isLoading: isDetailLoading, isError: isDetailError } = useProject(id)
  useEffect(() => {
    if (detailData?.data?.data) upsertDetail(detailData.data.data)
  }, [detailData, upsertDetail])

  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)
  const isConnecting = useChatStore((s) => s.isConnecting)
  useEffect(() => {
    if (chatId) connect(chatId)
    else disconnect()
  }, [chatId, connect, disconnect])
  useDocumentTitle(project ? project.name : '프로젝트')
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
  const { mutate: uploadDoc } = useUploadProjectDocument(id ?? '')
  const { mutate: deleteDoc, isPending: isDeletingDoc } = useDeleteProjectDocument(id ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePickFile = () => fileInputRef.current?.click()
  const handleUploadFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !id) return
    uploadDoc(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleRetryDoc = () => {}

  const { data: sessionsData } = useProjectSessions(id)
  const [chats, setChats] = useState<ProjectChat[]>([])
  useEffect(() => {
    if (!sessionsData) return
    const items = sessionsData.pages.flatMap((p) => p.data.data.items)
    setChats(items.map((s) => ({
      id: s.session_id,
      title: s.title,
      isFavorite: s.is_favorite,
      updatedAt: formatTime(s.updated_at),
      messageCount: 0,
    })))
  }, [sessionsData])

  const { mutate: updateSessionApi } = useUpdateSession()
  const { mutate: toggleSessionFavoriteApi } = useToggleSessionFavorite()
  const { mutate: deleteSessionApi } = useDeleteSession()

  const renameChat = (targetId: string, next: string) => {
    setChats((prev) => prev.map((c) => (c.id === targetId ? { ...c, title: next } : c)))
    updateSessionApi({ sessionId: targetId, data: { title: next } })
  }
  const toggleChatFavorite = (targetId: string) => {
    const cur = chats.find((c) => c.id === targetId)
    setChats((prev) => prev.map((c) => (c.id === targetId ? { ...c, isFavorite: !c.isFavorite } : c)))
    toggleSessionFavoriteApi({ sessionId: targetId, next: !(cur?.isFavorite ?? false) })
  }
  const deleteChat = (targetId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== targetId))
    deleteSessionApi(targetId)
    if (openChatId === targetId) closeChat()
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
              onChange={(e) => setNameDraft(e.target.value)}
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
            onDelete={() => {
              const ok = window.confirm(
                `'${project.name}' 프로젝트를 삭제하시겠습니까?\n\n하위 대화와 메시지, 업로드한 참고 파일이 모두 함께 삭제되며 되돌릴 수 없습니다.`,
              )
              if (!ok) return
              deleteProjectApi(project.id)
              navigate('/chat')
            }}
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
                <PlusIcon className="h-4 w-4" />
              </IconButton>
            }
          >
            <InstructionBody text={project.instructions} onEdit={() => setModalOpen(true)} clamp={6} />
          </Block>

          <Block
            title={`파일 ${documents.length}`}
            action={
              <IconButton label="파일 업로드" onClick={handlePickFile}>
                <PlusIcon className="h-4 w-4" />
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
            {documents.length === 0 ? (
              <button type="button" onClick={handlePickFile} className="w-full text-left">
                <EmptyFiles />
              </button>
            ) : (
              <div className="-mx-2">
                {documents.map((d) => (
                  <PollingDocRow
                    key={d.document_id}
                    projectId={id ?? ''}
                    doc={d}
                    onRetry={handleRetryDoc}
                    onDelete={() => deleteDoc(d.document_id)}
                    deleting={isDeletingDoc}
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

      {/* ── 오른쪽 : 대화 영역 ── */}
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

        {openChatId ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 min-h-0">
              <MessageList title={project.name} isLoading={isConnecting} hideHeader />
            </div>
            <div className="shrink-0 bg-surface px-4 pb-2">
              <ChatInput isConnecting={isConnecting} hideDomain />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
            <div className="w-full max-w-[720px] animate-page-in">
              <p className="mb-6 text-center text-[14px] text-text-muted">
                MARS는 이 프로젝트에서 대화할 때마다 동일한 지침과 파일을 참조합니다.
              </p>
              <ChatInput projectId={project.id} hideDomain />
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
        onUpload={(file) => id && uploadDoc(file)}
        onDelete={(docId) => deleteDoc(docId)}
        onRetry={handleRetryDoc}
        deleting={isDeletingDoc}
      />
    </div>
  )
}
