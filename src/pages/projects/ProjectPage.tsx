import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../../features/projects/projectStore'
import { useChatStore } from '../../api/store/chatStore'
import type { ProjectChat } from '../../features/projects/mock'
import { useProject, useUpdateProject, useToggleProjectFavorite, useSetProjectInstruction, useProjectSessions } from '../../hooks/useProject'
import ChatInput from '../../ui/components/chat/ChatInput'
import MessageList from '../../ui/components/messages/MessageList'
import {
  Block,
  ChatRow,
  EmptyFiles,
  FavStar,
  FileRow,
  FilesModal,
  IconButton,
  InstructionBody,
  InstructionModal,
  KebabMenu,
  Mark,
  NewChatIcon,
  PanelIcon,
  PlusIcon,
  ProjectPath,
  SparkIcon,
} from '../../features/projects/ui'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

// ISO(2026-08-06T10:10:26Z) → "오후 7:10" 형태 시간. 파싱 실패 시 빈 문자열.
const formatTime = (iso?: string | null): string => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
}

// 프로젝트 화면 — [좌] 컨텍스트 열(지침·파일·대화) / [우] 대화 영역.
// 컨텍스트가 늘 왼쪽에 서 있어서 '무엇이 고정되어 있는지'를 항상 볼 수 있다.
//
// 프로젝트 목록(홈) 화면은 없다 — 사이드바의 '프로젝트' 섹션이 목록 역할을 하고,
// 상단 표기는 클릭되지 않는 `프로젝트이름 / 세션이름` 텍스트다.
//
// TODO(API): 이 화면의 데이터 연결 지점.
//   - 프로젝트 상세(지침·파일 목록) 조회
//   - 프로젝트별 세션 목록 조회
//   - 지침 저장 / 파일 업로드·삭제 / 즐겨찾기 토글 / 이름 변경·삭제
//   현재는 features/projects/mock.ts 의 목업을 그대로 그린다.
export default function ProjectPage() {
  // chatId가 있으면 그 대화를 열어둔 상태로 들어온다(사이드바 '최근 대화'에서 진입).
  const { id, chatId } = useParams()
  const navigate = useNavigate()
  // 사이드바와 같은 목록을 본다 → 이름 변경·즐겨찾기가 양쪽에 함께 반영된다.
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const removeProject = useProjectStore((s) => s.remove)
  const upsertDetail = useProjectStore((s) => s.upsertDetail)
  // 이름 수정·즐겨찾기·지침은 서버 반영(낙관적). 삭제는 아직 API가 없어 로컬만 바뀐다.
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: toggleFavoriteApi } = useToggleProjectFavorite()
  const { mutate: setInstructionApi } = useSetProjectInstruction()
  const renameProject = (pid: string, next: string) => updateProject({ projectId: pid, title: next })
  const toggleFavorite = (pid: string) => toggleFavoriteApi({ projectId: pid, next: !(project?.isFavorite ?? false) })

  // 프로젝트 상세(지침 포함) 조회 → 스토어에 반영. 목록만으로 들어오면 지침이 비어 있으므로 여기서 채운다.
  // URL로 바로 진입(사이드바 목록 미경유)하면 스토어가 비어 있을 수 있어, 로딩/에러 상태로 화면을 나눈다.
  const { data: detailData, isLoading: isDetailLoading, isError: isDetailError } = useProject(id)
  useEffect(() => {
    if (detailData?.data?.data) upsertDetail(detailData.data.data)
  }, [detailData, upsertDetail])

  // 특정 대화(chatId)를 열면 그 세션을 connect, 아니면(새 대화 입력창) 이전 스트림 상태를 초기화한다.
  // (초기화하지 않으면 이전 채팅의 isStreaming이 남아 전송이 '정지' 버튼으로 막힌다)
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
  // 열려 있는 세션은 URL(:chatId)이 진실. 상태로 따로 들고 있으면
  // 사이드바에서 다른 대화를 눌러 같은 화면으로 재진입할 때 갱신되지 않는다.
  const openChatId = chatId ?? null
  const openProjectChat = (nextId: string) => navigate(`/projects/${id}/${nextId}`)
  const closeChat = () => navigate(`/projects/${id}`)
  // 컨텍스트 열 접기/펴기 — 대화에 집중하고 싶을 때 접는다.
  const [panelOpen, setPanelOpen] = useState(true)

  // 프로젝트 하위 대화 세션 목록(서버, 커서). 화면 모델(ProjectChat)로 매핑한다.
  // (개별 대화의 이름변경/즐겨찾기/삭제 API는 아직 없어, 그 조작은 화면 로컬 상태에서만 반영한다)
  const { data: sessionsData } = useProjectSessions(id)
  const [chats, setChats] = useState<ProjectChat[]>([])
  useEffect(() => {
    if (!sessionsData) return
    const items = sessionsData.pages.flatMap((p) => p.data.data.items)
    setChats(items.map((s) => ({
      id: s.session_id,
      title: s.title,
      isFavorite: s.is_favorite,
      // ISO 원문 대신 시간만 표시(예: 오후 7:10). 파싱 실패 시 빈 값.
      updatedAt: formatTime(s.updated_at),
      messageCount: 0, // 서버가 메시지 수를 주지 않아 0으로 둔다(화면에서 미표시)
    })))
  }, [sessionsData])

  // 인자명은 targetId — URL의 chatId와 헷갈리지 않게 구분한다.
  const renameChat = (targetId: string, next: string) =>
    setChats((prev) => prev.map((c) => (c.id === targetId ? { ...c, title: next } : c)))
  const toggleChatFavorite = (targetId: string) =>
    setChats((prev) => prev.map((c) => (c.id === targetId ? { ...c, isFavorite: !c.isFavorite } : c)))
  const deleteChat = (targetId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== targetId))
    // 지금 열어둔 대화를 지웠으면 프로젝트 화면으로 물러난다.
    if (openChatId === targetId) closeChat()
  }

  // 프로젝트 이름 인라인 변경 확정. 빈 이름이거나 그대로면 무시한다.
  const submitRename = () => {
    const next = nameDraft.trim()
    if (project && next && next !== project.name) renameProject(project.id, next)
    setRenaming(false)
  }

  if (!project) {
    // 스토어에 아직 없음: 상세 로딩 중이면 로딩, 조회 실패(없음/권한)면 안내.
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
      {/* ── 왼쪽 : 컨텍스트 열 ──
          접을 때 폭만 줄이면 내용이 좁아지며 글자가 다시 줄바꿈돼(리플로우) 뭉개져 보인다.
          그래서 바깥(aside)의 폭만 애니메이션하고, 안쪽은 336px 고정 폭을 유지한 채
          통째로 왼쪽으로 밀어낸다 → 글자는 그대로, 패널만 스르륵 사라진다. */}
      <aside
        style={{
          // 테두리도 함께 사라지게 색을 투명으로 보간한다.
          // (border-r-0로 끄면 1px이 한 프레임에 툭 사라져 '끊긴' 느낌이 난다)
          borderRightColor: panelOpen ? '#f4eced' : 'transparent',
        }}
        className={`h-full shrink-0 overflow-hidden border-r transition-[width,border-color] duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] ${
          panelOpen ? 'w-[336px]' : 'w-0'
        }`}
      >
        <div
          className={`custom-scroll h-full w-[336px] overflow-y-auto px-4 py-6 transition-transform duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] ${
            // 폭이 줄어드는 만큼 내용도 같은 속도로 왼쪽으로 빠져나간다
            // (일부만 밀면 잘리는 순간이 보인다 → 폭 전체만큼 민다)
            panelOpen ? 'translate-x-0' : '-translate-x-[336px]'
          }`}
        >
        {/* 컨텍스트 열 머리 : [표식] 이름 ★ ⋮ … 접기
            즐겨찾기 별은 이름 바로 옆에 붙이고, 접기 버튼만 오른쪽 끝으로 민다. */}
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
              removeProject(project.id)
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
            title={`파일 ${project.files.length}`}
            action={
              <IconButton label="파일 관리" onClick={() => setFilesOpen(true)}>
                <PlusIcon className="h-4 w-4" />
              </IconButton>
            }
          >
            {project.files.length === 0 ? (
              <button type="button" onClick={() => setFilesOpen(true)} className="w-full text-left">
                <EmptyFiles />
              </button>
            ) : (
              // 별도 '파일 올리기' 버튼은 두지 않는다 — 블록 머리의 +가 파일 모달을 연다.
              <div className="-mx-2">
                {project.files.map((f) => (
                  <FileRow key={f.id} file={f} />
                ))}
              </div>
            )}
          </Block>

          <Block
            title={`대화 ${chats.length}`}
            action={
              /* TODO(API): 이 프로젝트에서 새 대화 시작 연결 지점 */
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
        {/* 클릭되지 않는 표시 전용 경로 : 프로젝트이름 / 세션이름 */}
        {/* 헤더는 패널과 같은 리듬으로 움직인다.
            '펴기' 버튼을 조건부로 넣고 빼면 그 순간 경로 텍스트가 툭 밀리므로,
            항상 자리에 두고 폭·투명도만 애니메이션한다. */}
        <header className="flex items-center border-b border-[#f4eced] px-5 py-3.5">
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
          /* 기존 대화를 연 상태 : 실제 채팅 화면(메시지 목록 + 입력창).
             ChatInput에 projectId를 넘기지 않는다 — 이미 세션이 있으므로 새로 만들지 않고 그 세션에 보낸다. */
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 min-h-0">
              {/* 프로젝트 화면엔 이미 상단 경로 헤더가 있으므로 MessageList 자체 헤더는 숨긴다. */}
              <MessageList title={project.name} isLoading={isConnecting} hideHeader />
            </div>
            <div className="shrink-0 bg-surface px-4 pb-2">
              {/* 프로젝트 대화는 지침/파일 기반 → 도메인 선택 숨김 */}
              <ChatInput isConnecting={isConnecting} hideDomain />
            </div>
          </div>
        ) : (
          /* 새 대화 시작 : 안내 + 입력창. 전송하면 이 프로젝트 소속 세션을 만들고 /projects/{id}/{sid}로 이동. */
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
      <FilesModal open={filesOpen} files={project.files} onClose={() => setFilesOpen(false)} />
    </div>
  )
}
