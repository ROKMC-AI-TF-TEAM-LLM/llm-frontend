// 이용 안내 단계별 화면 예시(움직이는 모형). 실제 채팅 화면을 흉내 낸 것으로 서버와 연결되지 않는다.
import { useEffect, useState } from 'react'
import { AI_NOTICE } from '@/shared/constants'
import DomainIcon from '@/features/domains/components/DomainIcon'
import { DOMAINS, Q_TEXT, ANSWER_LINES } from './content'

function useTick(intervalMs = 80) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + intervalMs), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return t
}

export function Step01Mock() {
  const t = useTick()
  const q = Q_TEXT
  const cycle = 5200
  const p = t % cycle
  let qLen: number
  if (p < 2400) qLen = Math.floor((p / 2400) * q.length)
  else if (p < 3800) qLen = q.length
  else if (p < 4400)
    qLen = Math.max(0, q.length - Math.floor(((p - 3800) / 600) * q.length))
  else qLen = 0

  const showSend = qLen > 3

  return (
    <div className="h-full flex flex-col items-center justify-center gap-7 p-10">
      <div className="text-center">
        <div className="text-28 font-extrabold leading-[1.4] text-text-primary">
          해병대님, <span className="text-brand">무엇을</span> 도와드릴까요?
        </div>
        <div className="mt-2.5 text-sm text-rose-ash">
          법령·규정·규칙을 참조해 MARS가 근거와 함께 답합니다.
        </div>
      </div>
      <div className="w-full max-w-[440px]">
        <div className="rounded-[22px] bg-white border border-[#eee0e2] shadow-[0_8px_24px_rgba(150,0,40,0.05)]">
          <div className="min-h-[22px] px-[22px] pt-[18px] pb-1.5 text-15 text-text-primary">
            <span>{q.slice(0, qLen)}</span>
            <span className="inline-block w-0.5 h-4 bg-brand ml-px align-[-3px] animate-[blink_1.3s_ease-in-out_infinite]" />
          </div>
          <div className="flex items-center justify-between px-4 pt-1.5 pb-3.5">
            <div className="flex items-center gap-3">
              <PaperclipIcon />
              <DomainChip />
            </div>
            <span
              className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-brand to-brand-vivid-light flex items-center justify-center transition-all duration-500"
              style={{
                opacity: showSend ? 1 : 0,
                transform: showSend ? 'scale(1)' : 'scale(.6)',
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </span>
          </div>
        </div>
        <div className="mt-3.5 text-center text-12 text-[#c2b5ba]">
          {AI_NOTICE}
        </div>
      </div>
    </div>
  )
}

export function DomainStepMock() {
  const t = useTick()
  const total = DOMAINS.length + 1
  const activeIdx = Math.floor((t / 2000) % total) - 1

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-10">
      <div className="text-center">
        <div className="text-20 font-extrabold leading-[1.4] text-text-primary">
          검색할 범위를 골라보세요
        </div>
        <div className="mt-2 text-14 text-rose-ash">
          선택한 도메인 안에서만 근거를 찾습니다.
        </div>
      </div>

      <div className="w-[220px] rounded-2xl border border-surface-border shadow-[0_10px_30px_rgba(40,30,35,0.10)] p-1.5 bg-white">
        {DOMAINS.map((d, i) => (
          <GuideMenuRow
            key={d.code}
            active={activeIdx === i}
            icon={<DomainIcon code={d.code} size={14} />}
            label={d.label}
          />
        ))}
        <div className="my-1 h-px bg-surface-border mx-1.5" />
        <GuideMenuRow
          active={activeIdx === -1}
          icon={
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          }
          label="전체"
        />
      </div>
    </div>
  )
}

function GuideMenuRow({
  active,
  icon,
  label,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <div
      className={`w-full flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl text-14 text-left transition-colors ${
        active
          ? 'bg-brand-subtle text-brand font-semibold'
          : 'text-text-secondary'
      }`}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${active ? 'bg-brand-soft text-brand' : 'bg-surface-subtle text-text-muted'}`}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {active && (
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </div>
  )
}

export function Step02Mock() {
  const t = useTick()
  const perLine = 850
  const thinkFor = 1000
  const cycle = thinkFor + ANSWER_LINES.length * perLine + 2800
  const p = t % cycle
  const thinking = p < thinkFor
  const revealCount = thinking
    ? 0
    : Math.min(ANSWER_LINES.length, Math.floor((p - thinkFor) / perLine) + 1)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 px-9 pt-8 pb-3 overflow-hidden">
        <div className="flex justify-end mb-5">
          <div className="max-w-[82%] px-5 py-3 rounded-[18px_18px_4px_18px] bg-gradient-to-br from-brand to-brand-vivid-light text-white text-15 leading-[1.5]">
            해병대 창설과 그 배경에 대해 알려줄래?
          </div>
        </div>
        <div
          className="text-sm text-rose-ash overflow-hidden transition-all duration-500"
          style={{ opacity: thinking ? 1 : 0, maxHeight: thinking ? 24 : 0 }}
        >
          생각하는 중...
        </div>
        <div className="flex flex-col gap-2.5">
          {ANSWER_LINES.map((line, i) =>
            i < revealCount ? (
              <div
                key={i}
                className="text-15 leading-[1.75] text-ink animate-[lineIn_.5s_ease_both]"
              >
                {line}
              </div>
            ) : null,
          )}
        </div>
      </div>
      <div className="relative px-6 pb-[22px]">
        <div className="rounded-[22px] bg-white border border-[#eee0e2]">
          <div className="px-5 pt-3.5 pb-1 text-sm text-[#b09aa0]">
            메시지를 입력하세요...
          </div>
          <div className="flex items-center gap-3 px-4 pt-0.5 pb-3">
            <PaperclipIcon small />
            <DomainChip code="GENERAL" label="일반" />
          </div>
        </div>
      </div>
    </div>
  )
}
export function Step03Mock() {
  const t = useTick()
  const cycle = 6200
  const p = t % cycle
  const open = p >= 2400 && p < 5200

  return (
    <div className="p-9 text-15 leading-[1.8] text-ink">
      <div className="mb-5">
        국가계약법은 국가가 당사자가 되는 계약의 기본 사항을 규정한 법률입니다.
        적용 범위와 계약 원칙 등 주요 내용을 정리했습니다.
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-subtle text-brand text-xs font-medium rounded-full border border-brand-soft"
      >
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        출처 1개 {open ? '닫기' : '보기'}
      </button>

      <div
        className="overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
        style={{ maxHeight: open ? 80 : 0, opacity: open ? 1 : 0 }}
      >
        <div className="mt-2 w-full flex items-start gap-3 p-3 rounded-xl border border-surface-border bg-surface-subtle">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">
              국가를 당사자로 하는 계약에 관한 법률(법률)(제21418호)
            </p>
            <p className="text-xs text-text-muted mt-0.5">페이지 12</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaperclipIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 17
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={small ? '#c2b5ba' : '#b3a3a9'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11l-8.5 8.5a4 4 0 0 1-5.7-5.7l8.5-8.5a2.5 2.5 0 0 1 3.5 3.5L10 17" />
    </svg>
  )
}

function DomainChip({ code, label }: { code?: string; label?: string }) {
  const selected = !!code
  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 h-9 rounded-full text-14 font-medium ${
        selected ? 'bg-brand-subtle text-brand' : 'text-text-muted'
      }`}
    >
      {selected ? (
        <DomainIcon code={code!} size={18} />
      ) : (
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      )}
      <span>{label ?? '전체'}</span>
      <svg
        width={13}
        height={13}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  )
}
