// 문서 제작 화면 (v12)
//   첫 화면   → 가운데 한 열(제목·입력창). 생성 문서는 문서가 생긴 뒤에야 나타난다
//   전송      → 오른쪽 미리보기가 밀려 나오고, 문서 자리에는 스켈레톤이 깔린다
//   생성 중   → 왼쪽 진행 상황에서 대기·진행률·취소를 보여 준다
//   완료      → 스켈레톤이 걷히며 문서가 드러나고, 작업은 생성 문서 목록으로 내려간다
// 좁은 화면(lg 미만)에서는 미리보기가 목록 아래에 붙는다.
import { Collapse, MOTION } from './motion'
import { useDocGenWorkspace } from './hooks'
import PromptBox from './PromptBox'
import ProgressList from './ProgressList'
import DocumentList from './DocumentList'
import PreviewPanel from './PreviewPanel'

/** 왼쪽 작업 영역 : 오른쪽 미리보기 비율 */
const COLUMNS = {
  closed: 'minmax(0,1fr) minmax(0,0fr)',
  open: 'minmax(0,0.9fr) minmax(0,1.1fr)',
}
const COLUMN_GAP = 32

export default function DocGenWorkspace() {
  const { composer, isFresh, pending, send, activeJobs, finishedJobs, preview } = useDocGenWorkspace()

  return (
    <div className={`mx-auto w-full max-w-[1360px] px-4 pb-16 pt-[10vh] sm:px-6 lg:grid lg:transition-[grid-template-columns,column-gap] ${MOTION}`}
      style={{ gridTemplateColumns: preview.open ? COLUMNS.open : COLUMNS.closed, columnGap: preview.open ? COLUMN_GAP : 0 }}>
      <div className="mx-auto flex w-full min-w-0 max-w-[720px] flex-col">
        <h1 className="text-center text-[24px] font-bold text-text-primary sm:text-[28px]">
          어떤 <span className="text-brand">문서</span>를 만들까요?
        </h1>
        <p className="mt-2 text-center text-[13.5px] text-text-secondary">요청을 적고 양식을 고르면 그 양식에 맞춰 초안을 써 드립니다.</p>

        <div className="mt-7">
          <PromptBox c={composer} pending={pending} onSend={send} />
        </div>

        <Collapse open={activeJobs.length > 0}>
          <div className="pt-6">
            <ProgressList jobs={activeJobs} selectedId={preview.previewingId} onSelect={preview.view} isFresh={isFresh} />
          </div>
        </Collapse>

        <Collapse open={finishedJobs.length > 0}>
          <div className="pt-10">
            <DocumentList jobs={finishedJobs} selectedId={preview.previewingId} onSelect={preview.view} isFresh={isFresh} />
          </div>
        </Collapse>

        <p className="mt-6 text-center text-[11.5px] text-text-muted">MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오.</p>
      </div>

      <aside aria-label="미리보기" aria-hidden={!preview.open} inert={!preview.open}
        className={`min-w-0 transition-[opacity,transform] ${MOTION} ${preview.open ? 'translate-x-0 opacity-100 max-lg:mt-8' : 'translate-x-8 opacity-0 max-lg:hidden'}`}>
        <div className="overflow-hidden rounded-[20px] bg-surface shadow-[0_0_0_1px_var(--color-surface-border),0_12px_32px_rgba(0,0,0,0.06)] max-lg:h-[80vh] lg:sticky lg:top-6 lg:h-[calc(100vh-150px)] lg:min-h-[320px]">
          <PreviewPanel job={preview.job} pending={pending} onClose={preview.close} />
        </div>
      </aside>
    </div>
  )
}
