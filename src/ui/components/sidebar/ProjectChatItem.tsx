import { useNavigate } from 'react-router-dom'
import { displaySessionTitle } from '../../../utils/sessionTitle'

export interface ProjectChatEntry {
  id: string
  title: string
  updatedAt: string
  projectId: string
  projectName: string
}

export default function ProjectChatItem({ chat }: { chat: ProjectChatEntry }) {
  const navigate = useNavigate()
  const { text, isUntitled } = displaySessionTitle(chat.title)

  return (
    <li>
      <button
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
