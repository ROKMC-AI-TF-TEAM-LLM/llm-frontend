import { useNavigate } from 'react-router-dom'
import { displaySessionTitle } from '../../../utils/sessionTitle'

/** 최근 대화에 섞여 올라오는 '프로젝트 안 대화' 한 줄. */
export interface ProjectChatEntry {
  id: string
  title: string
  updatedAt: string
  projectId: string
  projectName: string
}

// 일반 세션 줄(SessionItem)과 구분되게 아래에 프로젝트 이름을 작게 붙인다.
// 누르면 그 프로젝트로 이동한다.
export default function ProjectChatItem({ chat }: { chat: ProjectChatEntry }) {
  const navigate = useNavigate()
  const { text, isUntitled } = displaySessionTitle(chat.title)

  return (
    <li>
      <button
        // 프로젝트만 열면 어떤 대화를 눌렀는지 잃어버린다 → 대화 id까지 함께 넘긴다.
        onClick={() => navigate(`/projects/${chat.projectId}/${chat.id}`)}
        title={`${chat.projectName} / ${text}`}
        className="flex w-full flex-col items-start rounded-[9px] px-[8px] py-[6px] text-left transition-colors hover:bg-[#fdedf2]"
      >
        <span
          className={`w-full truncate text-[13px] ${
            isUntitled ? 'font-normal text-text-muted' : 'font-medium text-[#5a5560]'
          }`}
        >
          {text}
        </span>
        <span className="w-full truncate text-[10.5px] text-[#c9aab2]">{chat.projectName}</span>
      </button>
    </li>
  )
}
