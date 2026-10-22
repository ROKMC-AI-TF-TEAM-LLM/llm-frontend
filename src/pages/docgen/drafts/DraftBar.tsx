// TEMP(시안 비교용): 시안이 정해지면 drafts 폴더째 삭제
import { Link } from 'react-router-dom'
import { DRAFTS } from './draftState'

/** 시안 전환 막대. 시안을 열면 늘 처음 상태에서 시작한다 */
export default function DraftBar({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-brand-soft bg-brand-subtle/60 px-5 py-2 text-[12.5px]">
      <span className="font-semibold text-brand">시안 비교</span>
      <div className="flex flex-wrap gap-1">
        {DRAFTS.map((d) => (
          <Link
            key={d.v}
            to={`/docgen/${d.v}`}
            className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${
              d.v === current ? 'bg-brand text-white' : 'text-text-secondary hover:bg-brand-soft'
            }`}
          >
            {d.v} {d.name}
          </Link>
        ))}
      </div>
      <span className="flex-1" />
      <span className="text-text-muted">결과는 무작위(완료·실패·취소) · 프롬프트에 ‘실패’·‘취소’를 넣으면 고정</span>
      <button type="button" onClick={() => window.location.reload()} className="rounded-full px-2.5 py-1 font-semibold text-text-secondary hover:bg-brand-soft">
        처음부터
      </button>
    </div>
  )
}
