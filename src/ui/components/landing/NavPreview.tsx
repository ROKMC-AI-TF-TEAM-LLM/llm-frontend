import { useEffect, useState } from 'react'

/**
 * 네비 드롭다운 오른쪽에 붙는 미리보기 애니메이션.
 *
 * 왼쪽 목록에서 가리킨 단계에 따라 다른 장면을 재생한다.
 * 실제 화면의 축소판처럼 보이게 만들어야 설득력이 생기므로,
 * 각 장면은 앱에서 쓰는 말풍선·칩·출처 카드의 형태를 그대로 따른다.
 */
export default function NavPreview({ sectionId }: { sectionId: string }) {
  switch (sectionId) {
    case 'step-02':
      return <DomainScene />
    case 'step-03':
      return <StreamScene />
    case 'step-04':
      return <SourceScene />
    default:
      return <TypingScene />
  }
}

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mars-navprev">
      <div className="mars-navprev-stage">{children}</div>
      <div className="mars-navprev-label">{label}</div>
    </div>
  )
}

/** 공통 시계 */
function useTick(ms: number) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), ms)
    return () => clearInterval(id)
  }, [ms])
  return t
}

/* ── STEP 01 : 질문이 타이핑되고 전송 버튼이 살아난다 ── */
const Q = '정기휴가 신청 절차 알려줘'
function TypingScene() {
  const t = useTick(140)
  // 타이핑 → 잠시 멈춤 → 처음으로. 한 사이클 = 글자수 + 여유 8틱
  const cycle = Q.length + 8
  const p = t % cycle
  const len = Math.min(p, Q.length)
  const ready = len === Q.length

  return (
    <Frame label="평소 말하듯 입력하면 됩니다">
      <div className="mars-navprev-fill">
        <div className="mars-navprev-greet">
          <div className="mars-navprev-greet-title">
            해병대님, <span className="text-brand">무엇을</span> 도와드릴까요?
          </div>
          <div className="mars-navprev-greet-sub">근거와 함께 답해 드립니다</div>
        </div>
        <div className="mars-navprev-composer">
          <div className="mars-navprev-composer-text">
            {Q.slice(0, len)}
            <span className="mars-navprev-caret" />
          </div>
          <div className="mars-navprev-composer-bar">
            <span className="mars-navprev-chip-sm">전체</span>
            <span className={`mars-navprev-send ${ready ? 'is-on' : ''}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* ── STEP 02 : 도메인 목록에서 선택이 옮겨 다닌다 ── */
const DOMS = ['전체', '인사·복지', '정보화·보안', '재무·법무']
function DomainScene() {
  const t = useTick(820)
  const active = t % DOMS.length
  return (
    <Frame label="분야를 좁히면 더 정확해집니다">
      <div className="mars-navprev-fill">
      <div className="mars-navprev-menu">
        {DOMS.map((d, i) => (
          <div key={d} className={`mars-navprev-menurow ${i === active ? 'is-on' : ''}`}>
            <span className="mars-navprev-menudot" />
            <span className="mars-navprev-menulabel">{d}</span>
            {i === active && (
              <svg className="mars-navprev-menucheck" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </div>
        ))}
      </div>
      </div>
    </Frame>
  )
}

/* ── STEP 03 : 질문 말풍선 뒤로 답변이 한 줄씩 차오른다 ── */
function StreamScene() {
  const t = useTick(560)
  const p = t % 6           // 0:생각중 → 1~3:줄 등장 → 4~5:유지
  const lines = Math.max(0, Math.min(3, p))
  return (
    <Frame label="찾는 즉시 실시간으로 답합니다">
      <div className="mars-navprev-fill">
      <div className="mars-navprev-chat">
        <div className="mars-navprev-bubble">정기휴가 며칠인가요?</div>
        <div className="mars-navprev-answer">
          {p === 0 ? (
            <span className="mars-navprev-thinking">근거를 찾는 중</span>
          ) : (
            [82, 96, 60].map((w, i) => (
              <span
                key={i}
                className="mars-navprev-line"
                style={{ width: `${w}%`, opacity: i < lines ? 1 : 0 }}
              />
            ))
          )}
        </div>
      </div>
      </div>
    </Frame>
  )
}

/* ── STEP 04 : 출처 배지를 누르면 원문 카드가 펼쳐진다 ── */
function SourceScene() {
  const t = useTick(1100)
  const open = t % 4 >= 1
  return (
    <Frame label="참고한 원문을 바로 펼쳐 봅니다">
      <div className="mars-navprev-fill">
      <div className="mars-navprev-src">
        <span className="mars-navprev-badge">
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .4s cubic-bezier(.2,.7,.2,1)' }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          출처 1개 {open ? '닫기' : '보기'}
        </span>
        <div className="mars-navprev-srccard" style={{ maxHeight: open ? 52 : 0, opacity: open ? 1 : 0 }}>
          <span className="mars-navprev-srcicon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </span>
          <span className="mars-navprev-srcbody">
            <span className="mars-navprev-srctitle">군인복무기본법 제18조</span>
            <span className="mars-navprev-srcpage">페이지 42</span>
          </span>
        </div>
      </div>
      </div>
    </Frame>
  )
}
