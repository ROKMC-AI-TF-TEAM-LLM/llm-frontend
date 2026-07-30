import { useNavigate, useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LandingFooter from '../ui/components/landing/LandingFooter'
import { TUTORIALS, findTutorial } from '../features/tutorials/tutorials'

/**
 * 튜토리얼(소개 영상) 페이지.
 *
 * 구성 : 브레드크럼 → 제목·설명 + 오른쪽 메타 → 영상 → 본문 요약 → 관련 튜토리얼 → 푸터.
 * 영상 자리는 아직 비어 있다(제작 중). 영상이 나오면 tutorials.ts 의 videoUrl만 채우면
 * 이 자리에 그대로 들어간다 — 화면 코드는 손댈 필요가 없다.
 */
export default function TutorialPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const tutorial = findTutorial(slug)
  useDocumentTitle(tutorial ? tutorial.title : '튜토리얼')

  if (!tutorial) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-[15px] font-semibold text-text-primary">튜토리얼을 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={() => navigate('/guide')}
          style={{ background: 'var(--color-brand)' }}
          className="mt-6 rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-hover)]"
        >
          가이드로 가기
        </button>
      </div>
    )
  }

  const related = TUTORIALS.filter((t) => t.slug !== tutorial.slug).slice(0, 4)

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 바 — 랜딩 네비와 같은 계열(워드마크 + 시작하기) */}
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

      {/* 브레드크럼 줄 */}
      <div className="flex items-center gap-2 border-b border-[#f4eced] px-[6vw] py-3.5 text-[13.5px]">
        <button
          type="button"
          onClick={() => navigate('/tutorials')}
          className="font-medium text-text-primary underline decoration-[rgba(26,25,23,0.25)] underline-offset-4 transition-colors hover:decoration-current"
        >
          튜토리얼
        </button>
        <span className="text-text-hint">/</span>
        <span className="truncate text-text-muted">{tutorial.title}</span>
      </div>

      {/* 제목 + 메타 */}
      <div className="mx-auto max-w-[1160px] px-[6vw] pt-16 pb-10 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-x-16 gap-y-8">
          <div className="min-w-[300px] max-w-[680px] flex-1">
            <h1 className="text-[clamp(38px,5.5vw,60px)] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary">
              {tutorial.title}
            </h1>
            <p className="mt-6 text-[clamp(17px,1.6vw,21px)] leading-[1.6] text-text-secondary break-keep">
              {tutorial.summary}
            </p>
          </div>

          {/* 오른쪽 메타 — 분류 / 대상 / 시청 시간 */}
          <dl className="flex w-[220px] shrink-0 flex-col gap-6">
            <MetaItem label="분류" value={tutorial.category} />
            <MetaItem label="대상" value={tutorial.product} />
            <MetaItem label="시청 시간" value={tutorial.watchTime} />
          </dl>
        </div>
      </div>

      {/* 영상 — 아직 제작 중이라 자리만 잡아둔다 */}
      <div className="mx-auto max-w-[1160px] px-[6vw] pb-16 lg:px-8">
        <VideoSlot title={tutorial.title} videoUrl={tutorial.videoUrl} />
      </div>

      {/* 이 영상에서 다루는 내용 */}
      <div className="mx-auto max-w-[1160px] px-[6vw] pb-20 lg:px-8">
        <h2 className="text-[22px] font-bold tracking-[-0.02em] text-text-primary">
          이 영상에서 다루는 내용
        </h2>
        <ol className="mt-6 flex flex-col gap-4">
          {tutorial.chapters.map((c, i) => (
            <li key={c.title} className="flex items-start gap-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-[11.5px] font-bold text-brand">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-text-primary">{c.title}</p>
                <p className="mt-1 text-[13.5px] leading-[1.7] text-text-secondary break-keep">{c.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* 관련 튜토리얼 */}
      {related.length > 0 && (
        <div className="border-t border-[#f4eced] bg-[#fdfbfb] px-[6vw] py-20">
          <h2 className="text-center text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em] text-text-primary">
            관련 튜토리얼
          </h2>
          <div className="mx-auto mt-12 grid max-w-[1160px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => navigate(`/tutorials/${t.slug}`)}
                className="flex min-h-[190px] flex-col rounded-[16px] border border-[#f0e6e8] bg-white p-6 text-left transition-colors hover:border-brand-soft hover:bg-[#fffcfd]"
              >
                <p className="text-[17px] font-bold leading-[1.35] tracking-[-0.01em] text-text-primary break-keep">
                  {t.title}
                </p>
                <span className="mt-auto flex items-center gap-2 pt-6 text-[13px] text-text-muted">
                  <PlayBadge />
                  튜토리얼
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <LandingFooter />
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12.5px] font-semibold text-text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-medium text-text-primary">{value}</dd>
    </div>
  )
}

function PlayBadge() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M10.5 9.2v5.6l4.6-2.8z" />
    </svg>
  )
}

/**
 * 영상 자리.
 * 영상이 준비되면 tutorials.ts 의 videoUrl을 채운다 → 여기 iframe이 들어간다.
 * 비어 있는 동안에는 '준비 중' 안내를 같은 비율(16:9)로 보여줘 레이아웃이 흔들리지 않게 한다.
 */
function VideoSlot({ title, videoUrl }: { title: string; videoUrl?: string }) {
  if (videoUrl) {
    return (
      <div className="relative w-full overflow-hidden rounded-[18px] bg-black" style={{ aspectRatio: '16 / 9' }}>
        <iframe
          src={videoUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    )
  }

  return (
    <div
      style={{
        aspectRatio: '16 / 9',
        background: 'linear-gradient(150deg,#fdf3f5 0%,#ffffff 55%,#fdf3f5 100%)',
      }}
      className="flex w-full flex-col items-center justify-center rounded-[18px] border border-[#f0e6e8]"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_6px_20px_rgba(160,0,40,0.10)]">
        <svg className="ml-1 h-6 w-6 text-brand" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      <p className="mt-5 text-[15px] font-semibold text-text-primary">영상 준비 중입니다</p>
      <p className="mt-1.5 text-[13px] text-text-muted">제작이 끝나면 이 자리에 바로 올라갑니다.</p>
    </div>
  )
}
