// TEMP(시안 비교용) v10 독수리 비행 막대 (B안): v7 진행 막대 머리를 독수리가 끌고 가고, 막대 끝에 별이 있다.
//   생성 중   → 독수리가 서버 진행률 위치를 날며 머리 위에 진행률 꼬리표를 단다. 살짝 오르내려 멈춘 것처럼 보이지 않는다
//   완료      → 독수리가 별에 닿고 별이 빨갛게 바뀐 뒤, v7처럼 막대가 미리보기로 펼쳐진다
//   대기·실패·중지 → 독수리가 회색으로 멈추고, 떨어진 버튼은 다시 시도 버튼이 된다
// 화면 본체는 EmblemBarStage.tsx (v11과 같이 쓴다).
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'
import EmblemBarStage from './EmblemBarStage'

export default function DraftV10() {
  useFreshDraft()
  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v10" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <EmblemBarStage variant="eagle" />
      </div>
    </div>
  )
}
