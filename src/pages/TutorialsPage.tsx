import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LandingFooter from '../ui/components/landing/LandingFooter'
import { TUTORIALS } from '../features/tutorials/tutorials'

// 튜토리얼 목록 — 브레드크럼의 '튜토리얼'이 여기로 온다.
export default function TutorialsPage() {
  useDocumentTitle('튜토리얼')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 flex items-center gap-7 border-b border-[#f4eced] bg-white/90 px-[6vw] py-3.5 backdrop-blur-md">
        <button onClick={() => navigate('/')} className="mars-nav-brand">
          MARS
        </button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ background: 'var(--color-brand)' }}
            className="rounded-[7px] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-hover)]"
          >
            시작하기
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1160px] px-[6vw] pt-16 pb-14 lg:px-8">
        <h1 className="text-[clamp(38px,5.5vw,60px)] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary">
          튜토리얼
        </h1>
        <p className="mt-6 max-w-[620px] text-[clamp(17px,1.6vw,21px)] leading-[1.6] text-text-secondary break-keep">
          짧은 영상으로 MARS를 익혀보세요. 처음 쓰는 분은 프로젝트부터 보시길 권합니다.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TUTORIALS.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => navigate(`/tutorials/${t.slug}`)}
              className="flex min-h-[230px] flex-col rounded-[16px] border border-[#f0e6e8] bg-white p-6 text-left transition-colors hover:border-brand-soft hover:bg-[#fffcfd]"
            >
              <p className="text-[18px] font-bold leading-[1.35] tracking-[-0.01em] text-text-primary break-keep">
                {t.title}
              </p>
              <p className="mt-3 line-clamp-3 text-[13.5px] leading-[1.7] text-text-secondary break-keep">
                {t.summary}
              </p>
              <span className="mt-auto flex items-center gap-2 pt-6 text-[12.5px] text-text-muted">
                {t.category} · {t.watchTime}
              </span>
            </button>
          ))}
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
