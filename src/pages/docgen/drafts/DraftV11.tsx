// TEMP(시안 비교용) v11 로프 위를 나는 독수리 (A+B안): v10의 독수리 막대에 v9의 로프 고리를 합쳤다.
//   막대   → 꼬인 로프 무늬가 흘러가고, 그 위를 독수리가 진행률 꼬리표를 달고 난다 (얼마나 왔는지)
//   버튼   → 떨어져 나온 중지 버튼 둘레에 로프 고리가 돈다 (아직 일하는 중인지. 진행률이 잠시 멈춰도 돈다)
//   완료   → 독수리가 끝에 닿고 버튼이 다시 붙은 뒤, v7처럼 막대가 미리보기로 펼쳐진다
//   실패·중지 → 로프와 고리가 그 자리에서 빨강(실패)·회색(중지)으로 멈추고, 버튼은 다시 시도가 된다
// 화면 본체는 EmblemBarStage.tsx (v10과 같이 쓴다).
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'
import EmblemBarStage from './EmblemBarStage'

export default function DraftV11() {
  useFreshDraft()
  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v11" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <EmblemBarStage variant="ropeEagle" />
      </div>
    </div>
  )
}
