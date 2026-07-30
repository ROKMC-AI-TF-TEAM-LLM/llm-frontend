import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LandingFooter from '../ui/components/landing/LandingFooter'
import { TUTORIALS } from '../features/tutorials/tutorials'
import { Reveal, TutorialCard, TutorialHeader } from '../features/tutorials/parts'

// 튜토리얼 목록. 히어로를 가운데 두고 아래에 카드 그리드를 깐다(클로드 구성).
export default function TutorialsPage() {
  useDocumentTitle('튜토리얼')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <TutorialHeader />

      {/* 히어로 — 옅은 빛무리를 깔아 흰 화면이 비어 보이지 않게 한다 */}
      <div className="relative overflow-hidden">
        <div
          className="mars-glow-bg"
          style={{ width: 520, height: 520, top: -260, left: '50%', marginLeft: -260 }}
        />
        <div className="relative mx-auto max-w-[820px] px-[6vw] pt-20 pb-16 text-center">
          <Reveal>
            <p className="mars-eyebrow justify-center">TUTORIALS</p>
            <h1 className="mars-display mt-5 text-[clamp(34px,5vw,54px)] text-text-primary break-keep">
              MARS <span className="text-brand">튜토리얼</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[560px] text-[clamp(16px,1.6vw,19px)] leading-[1.7] text-text-secondary break-keep">
              기능별 사용법을 짧은 영상으로 하나씩 익혀보세요.
              필요한 것만 골라 봐도 됩니다.
            </p>
          </Reveal>
        </div>
      </div>

      {/* 카드 그리드 — 차례로 올라오게 delay를 준다 */}
      <div className="mx-auto max-w-[1160px] px-[6vw] pb-24 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TUTORIALS.map((t, i) => (
            <Reveal key={t.slug} delay={i * 70} className="flex">
              <TutorialCard tutorial={t} onOpen={() => navigate(`/tutorials/${t.slug}`)} />
            </Reveal>
          ))}
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
