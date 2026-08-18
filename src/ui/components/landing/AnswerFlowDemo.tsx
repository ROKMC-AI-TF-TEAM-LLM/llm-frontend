import { getDomainStyle } from '../../../utils/document'

function FlowDoc({ title, department, domain }: { title: string; department: string; domain: string }) {
  const style = getDomainStyle(domain)
  return (
    <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-subtle text-left">
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: 38, height: 38, borderRadius: 10, background: style.badgeBg, color: style.bar }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[14px] font-bold text-text-primary">{title}</span>
          <span
            className="shrink-0 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: style.badgeBg, color: style.badgeText }}
          >
            {domain}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-text-muted truncate">{department}</p>
      </div>
    </div>
  )
}

export default function AnswerFlowDemo({ className = '' }: { className?: string }) {
  return (
    <div className={`mars-flow ${className}`}>
      <div className="mars-flow-head" aria-hidden>
        <span className="mars-flow-head-dot" style={{ background: '#ff5f57' }} />
        <span className="mars-flow-head-dot" style={{ background: '#febc2e' }} />
        <span className="mars-flow-head-dot" style={{ background: '#28c840' }} />
      </div>

      <div className="mars-flow-body">
        <div className="mars-flow-q">
          해병대 법률 규정에 대해 알려줄래?
        </div>

        <div className="mars-flow-step">
          <span className="mars-flow-badge">문서 검색</span>
          <span className="mars-flow-step-text">관련 규정을 찾는 중</span>
          <span className="mars-flow-dot" aria-hidden />
        </div>

        <div className="mars-flow-docs">
          <FlowDoc title="군인의 지위 및 복무에 관한 기본법" department="국방부 · 인사복지실" domain="인사·복지" />
          <FlowDoc title="해병대 인사·복무 규정" department="해병대사령부 인사처" domain="인사·복지" />
        </div>

        <div className="mars-flow-answer">
          <div className="mars-flow-answer-label">
            <span className="mars-flow-answer-dot" aria-hidden />
            근거와 함께 답변
          </div>
          <p className="mars-flow-answer-text">
            해병대는 <b>「군인의 지위 및 복무에 관한 기본법」</b>과 해병대 인사·복무 규정을
            함께 적용받습니다. 복무·복장·징계 등 세부 사항은 해당 규정에 따릅니다.
          </p>
          <div className="mars-flow-cite">
            <span className="mars-flow-cite-badge">출처 2건</span>
            <span className="mars-flow-cite-name">군인의 지위 및 복무에 관한 기본법 · 해병대 인사·복무 규정</span>
          </div>
        </div>
      </div>
    </div>
  )
}
