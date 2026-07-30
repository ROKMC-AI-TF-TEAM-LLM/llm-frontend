import { useNavigate, useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LandingFooter from '../ui/components/landing/LandingFooter'
import { TUTORIALS, findTutorial } from '../features/tutorials/tutorials'
import { Reveal, TutorialCard, TutorialHeader } from '../features/tutorials/parts'

/**
 * 튜토리얼(소개 영상) 페이지.
 *
 * 구성 : 브레드크럼 → 제목·설명 + 오른쪽 메타 → 영상 → 다루는 내용 → 관련 튜토리얼 → 푸터.
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
    <div className="min-h-screen bg-white">
      <TutorialHeader />

      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 border-b border-[#f4eced] px-[6vw] py-3.5 text-[13px]">
        <button
          type="button"
          onClick={() => navigate('/tutorials')}
          className="font-semibold text-text-primary transition-colors hover:text-brand"
        >
          튜토리얼
        </button>
        <span className="text-text-hint">/</span>
        <span className="truncate text-text-muted">{tutorial.title}</span>
      </div>

      {/* 제목 + 메타 */}
      <div className="mx-auto max-w-[1160px] px-[6vw] pt-16 pb-12 lg:px-8">
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

            {/* 오른쪽 메타 — 분류 / 대상 (시청 시간은 두지 않는다) */}
            <dl className="flex w-[200px] shrink-0 flex-col gap-5 border-l border-[#f4eced] pl-6">
              <MetaItem label="분류" value={tutorial.category} />
              <MetaItem label="대상" value={tutorial.product} />
            </dl>
          </div>
        </Reveal>
      </div>

      {/* 영상 */}
      {/* 영상 영역은 좌우 여백을 최소로 둔다 — 영상 원본이 1308px이라
          여백으로 폭을 깎으면 축소되면서 영상 속 UI 글자가 흐려진다.
          화면이 좁을 때만 여백이 생기도록 px는 작게 잡았다. */}
      <div className="mx-auto max-w-[1340px] px-4 pb-20">
        <Reveal delay={80}>
          <VideoSlot title={tutorial.title} tint={tutorial.tint} videoUrl={tutorial.videoUrl} />
        </Reveal>
        {/* 영상 고지 — 화면 톤을 흐리지 않게 작고 옅은 회색으로. 영상 왼쪽 끝에 맞춘다. */}
        <p className="mx-auto mt-4 max-w-[1308px] text-[12px] leading-[1.7] text-text-muted">
          본 영상은 사용법 안내를 위해 제작된 픽션입니다. 등장하는 인물·부대·문서·상황은
          실제와 무관하며, 예시로 나오는 규정 내용은 실제 규정을 대신할 수 없습니다.
        </p>
      </div>

      {/* 이 기능이 있는 이유 — 영상이 '쓰는 법'을 보여주므로 본문은 '왜 있는지'를 다룬다.
          같은 내용을 두 번 말하지 않게 역할을 나눴다. */}
      <div className="mx-auto max-w-[760px] px-[6vw] pb-24 lg:px-8">
        <Reveal>
          <p className="mars-eyebrow">WHY</p>
          <h2 className="mt-4 text-[26px] font-bold tracking-[-0.02em] text-text-primary">
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
      </div>

      {/* 관련 튜토리얼 */}
      {related.length > 0 && (
        <div className="border-t border-[#f4eced] bg-[#fdfbfb] px-[6vw] py-20">
          <Reveal>
            <h2 className="text-center text-[clamp(26px,3.6vw,38px)] font-bold tracking-[-0.03em] text-text-primary">
              이어서 볼 만한 튜토리얼
            </h2>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-[1160px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

/**
 * 영상 자리.
 * 영상이 준비되면 tutorials.ts 의 videoUrl을 채운다 → 여기 iframe이 들어간다.
 * 비어 있는 동안에도 같은 비율(16:9)을 지켜 레이아웃이 흔들리지 않게 한다.
 */
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
    // 폐쇄망 운용이라 외부 임베드(iframe) 대신 public/ 에 둔 파일을 직접 재생한다.
    // preload="metadata" : 27MB짜리를 페이지 열자마자 다 내려받지 않게 한다(첫 프레임만).
    //
    // 비율을 16:9로 고정하지 않는다 — 녹화 영상은 1308x732처럼 어중간한 비율이라
    // 틀에 억지로 맞추면 그 차이만큼 눌려 깨져 보인다. 폭만 채우면 원래 비율로 그려진다.
    //
    // preload="auto" : 로컬 파일이라 미리 받아둬야 재생 중 끊기지 않는다.
    // (metadata로 두면 재생하면서 조금씩 받아 30fps가 고르게 안 나온다)
    //
    // 모서리는 둥글게 깎지 않는다(각진 사각).
    // <video>는 브라우저가 GPU에서 별도 레이어로 합성하기 때문에,
    // border-radius를 주든 부모에 overflow-hidden을 걸든 곡선 경계에
    // 계단 모양 부스러기가 남는다(안티에일리어싱이 적용되지 않는다).
    // 억지로 둥글게 만들다 지저분해지는 것보다 각진 편이 깔끔하다.
    return (
      <div className="mx-auto w-full max-w-[1308px]">
        <video
          src={videoUrl}
          title={title}
          controls
          playsInline
          preload="auto"
          className="block h-auto w-full bg-black"
        />
      </div>
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
