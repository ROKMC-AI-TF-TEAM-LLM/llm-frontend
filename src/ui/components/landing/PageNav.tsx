import { useNavigate } from 'react-router-dom'

export type NavKey = 'guide' | 'tutorials' | 'team'

const ITEMS: { key: NavKey; label: string; path: string }[] = [
  { key: 'guide', label: '서비스 이용법', path: '/guide' },
  { key: 'tutorials', label: '튜토리얼', path: '/tutorials' },
  { key: 'team', label: '팀 소개', path: '/team' },
]

// 현재 페이지(current)를 제외한 나머지 탭을 보여주는 공통 상단 헤더
export default function PageNav({ current }: { current: NavKey }) {
  const navigate = useNavigate()

  const go = (path: string) => {
    navigate(path)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <div
      style={{ padding: '14px clamp(20px, 6vw, 64px)' }}
      className="sticky top-0 z-40 flex items-center border-b border-[#f2e2e6] bg-white/[0.82] backdrop-blur-md"
    >
      <button onClick={() => navigate('/')} className="mars-nav-brand">
        MARS
      </button>

      <nav className="ml-auto flex items-center gap-[26px]">
        {ITEMS.filter((i) => i.key !== current).map((i) => (
          <button
            key={i.key}
            type="button"
            onClick={() => go(i.path)}
            className="mars-nav-trigger hidden sm:block"
          >
            {i.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-hover"
        >
          시작하기
        </button>
      </nav>
    </div>
  )
}
