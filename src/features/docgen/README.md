# 문서 생성(docgen)

화면은 `src/pages/docgen/DocGenPage.tsx`(라우트 `/docgen`, 사이드바 "문서 제작") 하나이며,
이 폴더의 조각과 훅을 가져다 씁니다. (여러 시안 중 v12안으로 확정)

## 구성

| 위치 | 하는 일 | 백엔드 연결 시 |
| --- | --- | --- |
| `types/docgen.ts` | 작업·양식 타입 | 백엔드 명세에 맞춰 수정 |
| `utils/docgen.ts` | 상태 해석(`normalizeJobStatus`), 오류 문구, 포맷 | 유지 |
| `api/services/docgen.ts` | API 호출 | 경로만 맞추기 |
| `mock/handlers/docgen.ts` | `npm run dev:mock`용 가짜 API. 결과 무작위(완료·실패·취소) | 명세에 맞춰 응답 모양만 수정 |
| `hooks/useDocGen.ts` | 목록 조회(진행 중이면 1초마다 갱신), 생성·취소·재시도·삭제 | 유지 |
| `features/docgen/hooks.ts` | 입력창(`useComposer`), 새 줄 표시(`useFreshIds`), 누를 수 있는 줄(`selectable`) | 유지 |
| `features/docgen/components.tsx` | 상태 배지·진행 문구·미리보기 종이·작업 버튼·선택 칩 | 유지 |
| `features/docgen/icons.tsx` | 아이콘 | 유지 |

## 남은 일

1. 백엔드가 준비되면 `types`·`services` 경로와 `mock/handlers/docgen.ts` 응답을 명세에 맞춘다.
2. 다운로드 버튼(`DownloadButton`)에 다운로드 엔드포인트를 연결한다.
