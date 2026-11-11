import { useState, type ReactNode } from 'react'
import { EditIcon, StarAltIcon, StarIcon, TrashIcon } from '@/shared/components/icons'

// 대화와 프로젝트는 별 모양·색과 아이콘 선 굵기가 조금 다르다. 모양을 바꾸지 않으려고 값만 나눠 둔다 (합칠 후보).
const LOOK = {
  chat: {
    fade: 'w-32',
    Star: StarAltIcon,
    strokeWidth: 2.2,
    starOn: 'text-[#e4b100]',
    starOff: 'text-text-muted hover:text-[#e4b100]',
  },
  project: {
    fade: 'w-28',
    Star: StarIcon,
    strokeWidth: 1.9,
    starOn: 'text-brand',
    starOff: 'text-text-muted hover:text-brand',
  },
}

interface SidebarItemProps {
  kind: keyof typeof LOOK
  /** 이름. 이름 변경을 시작할 때 입력창에 채워진다 */
  name: string
  /** 줄에 보이는 내용. 없으면 name을 그대로 보인다 */
  children?: ReactNode
  /** 이름 앞에 붙는 아이콘 */
  icon?: ReactNode
  /** 마우스를 올렸을 때 보이는 툴팁 */
  tooltip?: string
  isActive: boolean
  isFavorite: boolean
  /** 이름 입력 최대 글자 수 */
  maxLength?: number
  labels: { rename: string; remove: string }
  onOpen: () => void
  /** 바뀐 이름(앞뒤 공백 제거, 비어 있지 않고 이전과 다를 때만 불린다) */
  onRename: (next: string) => void
  onToggleFavorite: () => void
  onDelete: () => void
}

/** 사이드바의 대화·프로젝트 한 줄: 열기, 이름 변경(제자리 편집), 즐겨찾기, 삭제 */
export default function SidebarItem({
  kind,
  name,
  children,
  icon,
  tooltip,
  isActive,
  isFavorite,
  maxLength,
  labels,
  onOpen,
  onRename,
  onToggleFavorite,
  onDelete,
}: SidebarItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const look = LOOK[kind]

  const submit = () => {
    const next = draft.trim()
    if (next && next !== name) onRename(next)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <li>
        <input
          autoFocus
          spellCheck={false}
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          className="w-full rounded-lg border border-surface-border bg-surface px-[8px] py-[7px] text-sm text-text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </li>
    )
  }

  const actionClass = 'rounded-lg p-1.5 transition-colors'

  return (
    <li className="group relative">
      <button
        onClick={onOpen}
        title={tooltip}
        className={`flex w-full items-center gap-2.5 rounded-[9px] px-[8px] py-[7px] text-left text-[13px] transition-colors ${
          isActive ? 'bg-brand-tint font-bold text-brand-deep' : 'font-medium text-text-primary hover:bg-brand-tint hover:text-brand-deep'
        }`}
      >
        {icon}
        {children ?? <span className="truncate overflow-hidden">{name}</span>}
      </button>

      {/* 마우스를 올리면 오른쪽 동작 버튼 뒤로 이름이 흐려지게 한다 */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 ${look.fade} rounded-r-[9px] bg-[linear-gradient(to_right,rgba(253,237,242,0)_0%,#fdedf2_35%)] opacity-0 transition-opacity duration-150 group-hover:opacity-100`}
      />

      <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          className={`${actionClass} hover:bg-brand-subtle ${isFavorite ? look.starOn : look.starOff}`}
        >
          <look.Star className="h-3 w-3" fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={look.strokeWidth} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setDraft(name)
            setIsEditing(true)
          }}
          aria-label={labels.rename}
          className={`${actionClass} text-text-muted hover:bg-brand-subtle hover:text-brand`}
        >
          <EditIcon className="h-3 w-3" strokeWidth={look.strokeWidth} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label={labels.remove}
          className={`${actionClass} text-text-muted hover:bg-red-50 hover:text-red-500`}
        >
          <TrashIcon className="h-3 w-3" strokeWidth={look.strokeWidth} />
        </button>
      </div>
    </li>
  )
}
