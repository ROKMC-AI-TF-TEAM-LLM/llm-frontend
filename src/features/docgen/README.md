# 문서 제작(docgen)

`/docgen` 화면(`pages/DocGenPage.tsx`)의 본체입니다. 시안 비교(v1~v13)를 거쳐 v12로 정했습니다.

## 구성

| 위치 | 하는 일 |
| --- | --- |
| `types/docgen.ts` | 작업·양식 타입 |
| `utils/docgen.ts` | 상태 해석(`normalizeJobStatus`, `isJobActive`), 오류 문구, 포맷 |
| `api/services/docgen.ts` | API 호출. `VITE_DOCGEN_MOCK=false`면 실제 서버 |
| `api/services/docgenMock.ts` | 목 서버. 결과 무작위(완료·실패·취소), 프롬프트에 '실패'·'취소'를 넣으면 고정 |
| `hooks/useDocGen.ts` | 서버 상태: 목록 조회(진행 중이면 1초마다 갱신), 생성·취소·재시도·삭제 |
| `features/docgen/hooks.ts` | 화면 상태: 입력창(`useComposer`), 화면 전체(`useDocGenWorkspace`), 새 줄 표시 |
| `features/docgen/components.tsx` | 공용 조각: 상태 배지·진행 막대·작업 버튼·미리보기 종이·선택 칩 |
| `features/docgen/icons.tsx` | 아이콘 |

훅을 두는 곳은 두 갈래다. 서버 상태(React Query)는 `api/services`·`types`와 짝을 맞춰 `src/hooks/useDocGen.ts`에,
이 화면에서만 쓰는 상태는 `features/docgen/hooks.ts`에 둔다.

### 화면

| 파일 | 하는 일 |
| --- | --- |
| `DocGenWorkspace.tsx` | 화면 배치. 미리보기가 열리면 두 열, 닫히면 가운데 한 열 |
| `PromptBox.tsx` | 입력창 + 분야·파일 유형·양식 칩 + 전송 버튼 |
| `ProgressList.tsx` | 진행 상황 (대기·생성 중 작업). 예상·남은 시간은 보여 주지 않음 |
| `DocumentList.tsx` | 생성 문서 (끝난 작업). 소요·완료 시각은 보여 주지 않음 |
| `PreviewPanel.tsx` | 오른쪽 미리보기. 생성 중에는 스켈레톤, 끝나면 문서가 떠오름 |
| `motion.tsx` | 공통 전환(`MOTION`), 접고 펴기(`Collapse`), 나타나기(`FadeIn`) |

## 남은 일

1. 백엔드가 준비되면 `types`·`services` 경로를 맞추고 `VITE_DOCGEN_MOCK=false`, `docgenMock.ts`를 지운다.
2. 다운로드 버튼(`components.tsx`의 `DownloadButton`, `PreviewPanel.tsx` 머리)에 다운로드 엔드포인트를 연결한다.
3. 사이드바 메뉴에 `/docgen` 진입점을 단다 (아직 주소로만 들어갈 수 있음).
