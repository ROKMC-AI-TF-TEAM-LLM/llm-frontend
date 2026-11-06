# 문서 생성(docgen)

시안(`src/pages/docgen/drafts`)은 이 폴더의 조각과 훅을 가져다 화면 배치만 다르게 짠 것입니다.
시안이 정해져도 여기 있는 코드는 그대로 씁니다.

## 구성

| 위치 | 하는 일 | 시안 확정 후 |
| --- | --- | --- |
| `types/docgen.ts` | 작업·양식 타입 | 백엔드 명세에 맞춰 수정 |
| `utils/docgen.ts` | 상태 해석(`normalizeJobStatus`), 오류 문구, 포맷 | 유지 |
| `api/services/docgen.ts` | API 호출. `VITE_DOCGEN_MOCK=false`면 실제 서버 | 경로만 맞추기 |
| `api/services/docgenMock.ts` | 목 서버. 결과 무작위(완료·실패·취소) | 백엔드 연결 후 삭제 |
| `hooks/useDocGen.ts` | 목록 조회(진행 중이면 1초마다 갱신), 생성·취소·재시도·삭제 | 유지 |
| `features/docgen/hooks.ts` | 화면 상태 훅: 입력창(`useComposer`), v12 화면(`useDocGenWorkspace`), 새 줄 표시. `useDocGenPage`·`useJobSelection`은 v1~v5 시안용 | 유지 (시안용 훅은 drafts와 함께 삭제) |
| `features/docgen/components.tsx` | 상태 배지·진행 문구·미리보기 종이·작업 버튼·선택 칩 | 유지 |
| `features/docgen/icons.tsx` | 아이콘 | 유지 |
| `features/docgen/*.tsx` (대문자) | v12 문서 제작 화면 본체 (아래 표) | 유력 후보. 확정되면 그대로 페이지에서 씀 |

훅을 두는 곳은 두 갈래다. 서버 상태(React Query)는 `api/services`·`types`와 짝을 맞춰 `src/hooks/useDocGen.ts`에,
화면에서만 쓰는 상태는 그 화면 옆 `features/docgen/hooks.ts`에 둔다.

### v12 화면

| 파일 | 하는 일 |
| --- | --- |
| `DocGenWorkspace.tsx` | 화면 배치. 미리보기가 열리면 두 열, 닫히면 가운데 한 열 |
| `PromptBox.tsx` | 입력창 + 분야·파일 유형·양식 칩 + 전송 버튼 |
| `ProgressList.tsx` | 진행 상황 (대기·생성 중 작업). 예상·남은 시간은 보여 주지 않음 |
| `DocumentList.tsx` | 생성 문서 (끝난 작업). 소요·완료 시각은 보여 주지 않음 |
| `PreviewPanel.tsx` | 오른쪽 미리보기. 생성 중에는 스켈레톤, 끝나면 문서가 떠오름 |
| `motion.tsx` | 공통 전환(`MOTION`), 접고 펴기(`Collapse`), 나타나기(`FadeIn`) |

## 시안을 정한 뒤

v12로 정하면 1·2번 대신 `src/pages/docgen/DocGenPage.tsx`에서 스크롤 상자 안에 `<DocGenWorkspace />`만 그리면 된다.

1. 고른 `DraftVn.tsx`를 `src/pages/docgen/DocGenPage.tsx`로 옮긴다.
2. 그 파일에서 `DraftBar`와 `useFreshDraft()`(시안을 열 때마다 목 작업을 비우는 훅)를 지운다.
3. `App.tsx`의 `DOCGEN_DRAFTS` 라우트를 `/docgen` 하나로 바꾸고 `drafts` 폴더를 지운다.
4. 백엔드가 준비되면 `types`·`services` 경로를 맞추고 `VITE_DOCGEN_MOCK=false`, `docgenMock.ts`를 지운다.
5. 다운로드 버튼(`DownloadButton`)에 다운로드 엔드포인트를 연결한다.
