import { useNavigate, useParams } from 'react-router-dom'
import type { ChatItem } from '../../../types'
import { useToggleFavorite } from '../../../hooks/useSession'

interface FavoriteChatsProps {
  isOpen: boolean
  /** 즐겨찾기된 세션들. 별도 상태가 아니라 세션 목록에서 파생된 값이다. */
  favorites: ChatItem[]
}

// 사이드바 '즐겨찾기' 섹션. 즐겨찾기가 하나도 없으면 섹션 자체를 렌더하지 않는다.
export default function FavoriteChats({ isOpen, favorites }: FavoriteChatsProps) {
  const navigate = useNavigate()
  const { id: currentId } = useParams()
  const { mutate: toggleFavorite } = useToggleFavorite()

  if (favorites.length === 0) return null

  return (
    <div
      className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <p className="px-[11px] text-[10.5px] font-extrabold tracking-[0.12em] text-[#c9aab2] mb-2 whitespace-nowrap uppercase">
        즐겨찾기
      </p>

      <ul className="space-y-0">
        {favorites.map((chat) => (
          <li key={chat.id} className="group relative">
            <button
              onClick={() => navigate(`/chat/${chat.id}`)}
              style={chat.id === currentId ? { background: '#fdedf2', color: '#c0002a' } : {}}
              className={`w-full flex items-center px-[11px] py-[7px] rounded-[9px] text-[13px] text-left transition-colors relative pr-9 ${
                chat.id === currentId
                  ? 'font-bold'
                  : 'text-[#5a5560] font-medium hover:bg-[#fdedf2] hover:text-[#c0002a]'
              }`}
            >
              <span className="truncate overflow-hidden">{chat.title}</span>
            </button>

            {/* 즐겨찾기 해제 (hover 시 노출) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite({ sessionId: chat.id, next: false })
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex p-1.5 rounded-lg text-[#e4b100] hover:bg-brand-subtle transition-colors"
              aria-label="즐겨찾기 해제"
            >
              {/* 채워진 별 */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.9 6.26 6.6.72-4.9 4.6 1.35 6.42L12 16.9 6.05 20l1.35-6.42L2.5 8.98l6.6-.72L12 2z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
