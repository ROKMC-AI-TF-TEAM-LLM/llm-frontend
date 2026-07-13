import { useState } from 'react'
import type { ChatItem } from '../../../types'
import SessionItem from './SessionItem'
import Toast from '../Toast'

interface FavoriteChatsProps {
  isOpen: boolean
  /** 즐겨찾기된 세션들. 별도 상태가 아니라 세션 목록에서 파생된 값이다. */
  favorites: ChatItem[]
}

// 사이드바 '즐겨찾기' 섹션. 즐겨찾기가 하나도 없으면 섹션 자체를 렌더하지 않는다.
// 세션 한 줄은 '최근 대화'와 동일한 SessionItem을 써서 별/수정/삭제 동작이 같다.
export default function FavoriteChats({ isOpen, favorites }: FavoriteChatsProps) {
  const [sidebarError, setSidebarError] = useState('')

  if (favorites.length === 0) return null

  return (
    <div
      className={`px-[12px] pt-[12px] overflow-hidden transition-opacity duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {sidebarError && <Toast message={sidebarError} onClose={() => setSidebarError('')} />}
      <p className="px-[11px] text-[10.5px] font-extrabold tracking-[0.12em] text-[#c9aab2] mb-2 whitespace-nowrap uppercase">
        즐겨찾기
      </p>

      <ul className="space-y-0">
        {favorites.map((chat) => (
          <SessionItem key={chat.id} chat={chat} onError={setSidebarError} />
        ))}
      </ul>
    </div>
  )
}
