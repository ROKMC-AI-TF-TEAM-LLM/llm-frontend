import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LandingFooter from '../ui/components/landing/LandingFooter'
import { TUTORIALS, findTutorial } from '../features/tutorials/tutorials'
import { Reveal, TutorialCard, TutorialHeader } from '../features/tutorials/parts'

export default function TutorialPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const tutorial = findTutorial(slug)
  useDocumentTitle(tutorial ? tutorial.title : '튜토리얼')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [slug])

  if (!tutorial) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-[15px] font-semibold text-text-primary">튜토리얼을 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={() => navigate('/tutorials')}
          style={{ background: 'var(--color-brand)' }}
          className="mt-6 rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--color-brand-hover)]"
        >
          튜토리얼 목록
        </button>
      </div>
    )
  }

  const related = TUTORIALS.filter((t) => t.slug !== tutorial.slug).slice(0, 3)

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg,#fdf6f8 0%,#ffffff 20%,#ffffff 100%)' }}
    >
      <TutorialHeader />

      <div className="flex items-center gap-2 border-b border-[#f4eced] px-[6vw] py-3.5 text-[13px]">
        <button
          type="button"
          onClick={() => navigate('/tutorials')}
          className="font-semibold text-text-primary mars-brand-serif transition-colors hover:text-brand"
        >
          튜토리얼
        </button>
        <span className="text-text-hint">/</span>
        <span className="truncate text-text-muted">{tutorial.title}</span>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="mars-glow-bg"
          style={{ width: 560, height: 560, top: -330, right: -80 }}
        />
        <div className="relative mx-auto max-w-[1160px] px-[6vw] pt-16 pb-12 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-start justify-between gap-x-16 gap-y-8">
              <div className="min-w-[300px] max-w-[660px] flex-1">
                <h1 className="mars-display text-[clamp(34px,5vw,54px)] text-text-primary break-keep">
                  {tutorial.title}
                </h1>
                <p className="mt-6 text-[clamp(16px,1.6vw,20px)] leading-[1.7] text-text-secondary break-keep">
                  {tutorial.summary}
                </p>
              </div>

              <dl className="flex w-[200px] shrink-0 flex-col gap-5 border-l border-[#f4eced] pl-6">
                <MetaItem label="분류" value={tutorial.category} />
                <MetaItem label="대상" value={tutorial.product} />
              </dl>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-[1160px] px-[6vw] pb-20 lg:px-8">
        <VideoSlot title={tutorial.title} tint={tutorial.tint} videoUrl={tutorial.videoUrl} />
        <p className="mt-4 text-[12px] leading-[1.7] text-text-muted">
          본 영상은 사용법 안내를 위해 제작된 픽션입니다. 등장하는 부대·문서·상황은
          실제와 무관하며, 예시로 나오는 규정 내용은 실제 규정을 대신할 수 없습니다.
        </p>
      </div>

      <div className="mx-auto max-w-[760px] px-[6vw] pb-24 lg:px-8">
        <Reveal>
          <p className="mars-eyebrow">WHY</p>
          <h2 className="mars-display mt-4 text-[26px] font-bold tracking-[-0.02em] text-text-primary">
            {tutorial.pointsTitle}
          </h2>
        </Reveal>

        <ol className="mt-9 flex flex-col">
          {tutorial.points.map((c, i) => (
            <Reveal key={c.title} delay={i * 60}>
              <li className="flex items-start gap-5 border-t border-[#f4eced] py-5">
                <span className="mt-0.5 shrink-0 text-[12px] font-extrabold tabular-nums text-brand">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="text-[15.5px] font-bold text-text-primary">{c.title}</p>
                  <p className="mt-1.5 text-[13.5px] leading-[1.75] text-text-secondary break-keep">
                    {c.desc}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={80}>
          <div
            style={{ background: 'linear-gradient(160deg,#fdf3f5 0%,#fffdfd 100%)' }}
            className="mt-14 rounded-[18px] border border-[#f2e2e6] px-8 py-9 text-center"
          >
            <p className="text-[19px] font-bold tracking-[-0.01em] mars-brand-serif text-text-primary break-keep">
              직접 해보는 게 가장 빠릅니다
            </p>
            <p className="mx-auto mt-3 max-w-[420px] text-[13.5px] leading-[1.7] text-text-secondary break-keep">
              지금 MARS에서 방금 본 내용을 그대로 따라 해보세요. 몇 분이면 충분합니다.
            </p>
            <button type="button" onClick={() => navigate('/')} className="mars-pill mars-pill-brand mt-6">
              MARS 시작하기 <span aria-hidden>→</span>
            </button>
          </div>
        </Reveal>
      </div>

      {related.length > 0 && (
        <div className="border-t border-[#f4eced] bg-[#fdfbfb] px-[6vw] py-20">
          <Reveal>
            <h2 className="mars-display text-center text-[clamp(26px,3.6vw,38px)] font-bold tracking-[-0.03em] text-text-primary">
              이어서 볼 만한 튜토리얼
            </h2>
          </Reveal>
          <div className="mx-auto mt-11 grid max-w-[1100px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t, i) => (
              <Reveal key={t.slug} delay={i * 70} className="flex">
                <TutorialCard tutorial={t} onOpen={() => navigate(`/tutorials/${t.slug}`)} />
              </Reveal>
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
      <dt className="text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-[#c9aab2]">
        {label}
      </dt>
      <dd className="mt-1.5 text-[14.5px] font-semibold text-text-primary">{value}</dd>
    </div>
  )
}

function VideoSlot({
  title,
  tint,
  videoUrl,
}: {
  title: string
  tint: string
  videoUrl?: string
}) {
  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        title={title}
        controls
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload noremoteplayback"
        className="block w-full"
        style={{
          aspectRatio: '16 / 9',
          background: '#ece7e6',
          transform: 'translateZ(0)',
          contain: 'paint',
        }}
      />
    )
  }

  return (
    <div
      style={{ background: tint, aspectRatio: '16 / 9' }}
      className="tut-slot group flex w-full flex-col items-center justify-center rounded-[20px]"
    >
      <span className="tut-play flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white/90 shadow-[0_10px_30px_rgba(60,20,30,0.12)]">
        <svg className="ml-1 h-7 w-7 text-brand" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      <p className="mt-6 text-[15px] font-bold text-text-primary">영상 준비 중입니다</p>
      <p className="mt-1.5 text-[13px] text-text-secondary">제작이 끝나면 이 자리에 바로 올라갑니다.</p>
    </div>
  )
}
