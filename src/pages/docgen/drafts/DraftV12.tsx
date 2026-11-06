// TEMP(시안 비교용) v12 문서 제작: v6 첫 화면 + v5 미리보기 열림 + v1 진행 상황
// 화면 본체는 features/docgen에 있다. 시안이 확정되면 DocGenWorkspace를 페이지에서 바로 쓴다.
// 진행은 서버(목) 작업 상태를 그대로 따른다. 결과는 무작위이고, 프롬프트에 '실패'·'취소'를 넣으면 고정된다.
import DocGenWorkspace from '../../../features/docgen/DocGenWorkspace'
import DraftBar from './DraftBar'
import { useFreshDraft } from './draftState'

export default function DraftV12() {
  useFreshDraft()
  return (
    <div className="flex h-full flex-col">
      <DraftBar current="v12" />
      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto">
        <DocGenWorkspace />
      </div>
    </div>
  )
}
