// 문서 스튜디오 홈: 요청 → 개요 확인 → 만들기. 만들기를 누르면 편집기(/studio/:id)로 넘어가 거기서 생성 과정을 본다.
// 아래에는 지금까지 만든 문서·발표 자료가 카드로 쌓인다.
import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { useDeleteDocGenJob } from '../../hooks/useDocGen'
import { showToast } from '../../api/store/toastStore'
import { KIND_LABEL } from '../../utils/docgen'
import { Picker, Spinner } from '../../features/docgen/components'
import { ArrowUpIcon, DocIcon } from '../../features/docgen/icons'
import DomainIcon from '../../ui/components/chat/DomainIcon'
import { useStudioComposer, useStudioWorks } from '../../features/studio/hooks'
import { KindSwitch, OutlineEditor, WorkCard } from '../../features/studio/components'
import '../../features/studio/studio.css'

const rise = (d: number) => ({ className: 'st-rise', style: { '--d': `${d}ms` } as CSSProperties })

const PLACEHOLDER = {
  deck: '예) 신병 교육 개선 방안을 지휘관 보고용으로 5장 정도 만들어 줘',
  doc: '예) 이번 분기 장비 점검 결과를 보고서로 정리해 줘',
}

export default function StudioHomePage() {
  const navigate = useNavigate()
  const c = useStudioComposer()
  const { works, isLoading } = useStudioWorks()
  const remove = useDeleteDocGenJob()
  const outlineOpen = c.outlining || !!c.outline
  // 개요 칸이 다 펼쳐졌는지 (펼치는 동안만 내용을 잘라 낸다)
  const [settled, setSettled] = useState(false)

  const send = () => { if (c.canSubmit) c.requestOutline() }

  const build = async () => {
    const job = await c.build()
    if (job) navigate(`/studio/${job.job_id}`)
  }

  const del = (id: string, title: string) => {
    if (!window.confirm(`'${title}'의 모든 버전을 지울까요?`)) return
    remove.mutate(id, { onError: () => showToast('지우지 못했습니다. 잠시 후 다시 시도해 주세요.') })
  }

  return (
    <div className="custom-scroll h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-[12vh] sm:px-6">
        <div className="mx-auto max-w-[760px]">
          <div className="st-rise flex flex-col items-center gap-5" style={rise(0).style}>
            <h1 className="text-center text-[24px] font-bold text-text-primary sm:text-[28px]">
              무엇을 <span className="text-brand">만들까요</span>?
            </h1>
            <KindSwitch value={c.kind} onChange={c.setKind} disabled={c.building} />
          </div>

          {/* 입력창과 개요는 한 장의 카드다. 개요를 받으면 아래로 펼쳐진다 */}
          <section aria-label="요청" className={`relative z-10 mt-8 rounded-[28px] border bg-surface shadow-[0_12px_30px_rgba(220,20,60,0.05)] transition-[border-color,box-shadow] duration-500 focus-within:shadow-[0_18px_44px_rgba(220,20,60,0.09)] ${outlineOpen ? 'border-surface-border' : 'border-brand-soft focus-within:border-brand'} ${rise(120).className}`}
            style={rise(120).style}>
            <label htmlFor="studio-prompt" className="sr-only">요청</label>
            <textarea id="studio-prompt" value={c.prompt} onChange={(e) => c.setPrompt(e.target.value)} rows={3} readOnly={c.building}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
              placeholder={PLACEHOLDER[c.kind]}
              className="w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted sm:px-6" />
            <div className="flex flex-wrap items-center gap-1 px-3 pb-3 pt-2">
              <Picker label="분야" value={c.domain} onChange={c.setDomain} disabled={c.building}
                icon={c.domain ? <DomainIcon code={c.domain} size={14} /> : undefined}
                options={[{ value: '', label: '전체 분야' }, ...c.domains.map((d) => ({ value: d.code, label: d.label }))]} />
              <Picker label="파일 형식" value={c.format} onChange={(v) => c.setFormat(v as typeof c.format)} disabled={c.building}
                options={c.formats.map((f) => ({ value: f.code, label: f.label }))} />
              <Picker label="양식" value={c.template?.template_id ?? null} onChange={c.pickTemplate} disabled={c.building} icon={<DocIcon className="h-3.5 w-3.5" />}
                options={c.templates.map((t) => ({ value: t.template_id, label: t.name, hint: t.description }))} />
              <span className="flex-1" />
              <button type="button" aria-label={c.outline ? '개요 다시 짜기' : '개요 짜기'} title={c.outline ? '개요 다시 짜기' : '개요 짜기'} disabled={!c.canSubmit} onClick={send}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[background-color,scale] duration-200 active:scale-90 ${c.canSubmit ? 'bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_5px_13px_rgba(220,20,60,0.28)]' : 'bg-surface-subtle text-text-muted'}`}>
                {c.outlining ? <Spinner className="h-4 w-4" /> : <ArrowUpIcon className="h-5 w-5" />}
              </button>
            </div>

            {/* 높이를 0fr → 1fr로 늘려 내용 높이만큼 펼친다. 다 펼친 뒤에는 잘라 내지 않아야 배치 메뉴가 보인다 */}
            <div className="grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(.32,.72,0,1)]" style={{ gridTemplateRows: outlineOpen ? '1fr' : '0fr' }}
              onTransitionEnd={(e) => { if (e.target === e.currentTarget) setSettled(outlineOpen) }}>
              <div className={`min-h-0 ${outlineOpen && settled ? '' : 'overflow-hidden'}`} inert={!outlineOpen}>
                <div className="border-t border-surface-border/70">
                  {outlineOpen && <OutlineEditor c={c} onBuild={build} />}
                </div>
              </div>
            </div>
          </section>

          <p className={`mt-4 text-center text-[11.5px] text-text-muted ${rise(200).className}`} style={rise(200).style}>
            {c.outline
              ? `개요대로 ${KIND_LABEL[c.kind].name}를 만든 뒤, 편집기에서 ${KIND_LABEL[c.kind].unit}이나 부분을 골라 말로 고칠 수 있습니다.`
              : '요청을 보내면 먼저 개요를 보여 드립니다. 확인하고 고친 뒤 만드세요.'}
          </p>
        </div>

        <section aria-label="최근 작업" className={`mt-20 ${rise(280).className}`} style={rise(280).style}>
          <h2 className="mb-3 px-1 text-[13px] font-semibold text-text-muted">최근 작업 {works.length}</h2>
          {!isLoading && works.length === 0 && (
            <p className="rounded-[20px] bg-surface px-4 py-10 text-center text-[12.5px] text-text-muted shadow-[0_0_0_1px_var(--color-surface-border)]">
              만든 문서와 발표 자료가 여기에 쌓입니다.
            </p>
          )}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((w, i) => (
              <WorkCard key={w.root.job_id} work={w} delay={Math.min(i, 8) * 50}
                onOpen={() => navigate(`/studio/${w.root.job_id}`)} onDelete={() => del(w.root.job_id, w.root.title)} />
            ))}
          </ul>
        </section>

        <p className="mt-10 text-center text-[11.5px] text-text-muted">
          목 데이터 · 결과는 무작위(완료·실패·취소)입니다. 요청에 ‘실패’·‘취소’를 넣으면 그 흐름으로 고정됩니다.
        </p>
      </div>
    </div>
  )
}
