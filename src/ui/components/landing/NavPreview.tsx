import { useEffect, useMemo, useState } from 'react'

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

function useTick(ms: number) {
  const [t, setT] = useState(0)
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  useEffect(() => {
    if (reduced) return
    let id = 0
    const start = () => {
      stop()
      id = window.setInterval(() => setT((v) => v + 1), ms)
    }
    const stop = () => {
      if (id) window.clearInterval(id)
      id = 0
    }
    const onVis = () => (document.hidden ? stop() : start())
    start()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [ms, reduced])
  return t
}

/* ── STEP 01 : 질문이 타이핑되고 전송 버튼이 살아난다 ── */
const Q = '정기휴가 신청 절차 알려줘'
function TypingScene() {
  const t = useTick(140)
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

/* ── STEP 03 : 질문을 보내면 답변이 실제로 한 글자씩 흘러나온다 ── */
const ANSWER = '군인은 연 21일의 정기휴가를 받으며, 부대 사정에 따라 분할 사용할 수 있습니다.'
function StreamScene() {
  const t = useTick(90)
  const THINK = 8
  const HOLD = 22
  const cycle = THINK + ANSWER.length + HOLD
  const p = t % cycle
  const thinking = p < THINK
  const len = Math.max(0, Math.min(p - THINK, ANSWER.length))
  const done = len === ANSWER.length

  return (
    <Frame label="찾는 즉시 실시간으로 답합니다">
      <div className="mars-navprev-fill">
        <div className="mars-navprev-chat">
          <div className="mars-navprev-bubble">정기휴가는 며칠인가요?</div>
          <div className="mars-navprev-answer">
            {thinking ? (
              <span className="mars-navprev-thinking">근거를 찾는 중...</span>
            ) : (
              <span className="mars-navprev-answertext">
                {ANSWER.slice(0, len)}
                {!done && <span className="mars-navprev-caret" />}
              </span>
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
        <div className="mars-navprev-srccard" style={{ maxHeight: open ? 60 : 0, opacity: open ? 1 : 0 }}>
          <span className="mars-navprev-srcicon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M8 13h8M8 17h5" />
            </svg>
          </span>
          <span className="mars-navprev-srcbody">
            <span className="mars-navprev-srchead">
              <span className="mars-navprev-srctitle">군인복무기본법 제18조</span>
              <span className="mars-navprev-srcdomain">인사·복지</span>
            </span>
            <span className="mars-navprev-srcpage">국방부 · 인사복지실</span>
          </span>
        </div>
      </div>
      </div>
    </Frame>
  )
}
