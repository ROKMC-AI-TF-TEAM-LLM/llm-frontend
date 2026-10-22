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
| `features/docgen/hooks.ts` | 입력창(`useComposer`), 고른 작업, 새 줄 표시, `useDocGenPage` | 유지 |
| `features/docgen/components.tsx` | 상태 배지·진행 문구·미리보기 종이·작업 버튼·선택 칩 | 유지 |
| `features/docgen/icons.tsx` | 아이콘 | 유지 |

## 시안을 정한 뒤

1. 고른 `DraftVn.tsx`를 `src/pages/docgen/DocGenPage.tsx`로 옮긴다.
2. 그 파일에서 `DraftBar`와 `useFreshDraft()`(시안을 열 때마다 목 작업을 비우는 훅)를 지운다.
3. `App.tsx`의 `DOCGEN_DRAFTS` 라우트를 `/docgen` 하나로 바꾸고 `drafts` 폴더를 지운다.
4. 백엔드가 준비되면 `types`·`services` 경로를 맞추고 `VITE_DOCGEN_MOCK=false`, `docgenMock.ts`를 지운다.
5. 다운로드 버튼(`DownloadButton`)에 다운로드 엔드포인트를 연결한다.
