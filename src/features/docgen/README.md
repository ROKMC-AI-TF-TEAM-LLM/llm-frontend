# 문서 생성(docgen)

화면은 `pages/DocGenPage.tsx`(라우트 `/docgen`, 사이드바 "문서 제작") 하나입니다. (여러 시안 중 v12안으로 확정)

## 구성 (이 폴더 기준)

| 위치 | 하는 일 | 백엔드 연결 시 |
| --- | --- | --- |
| `api.ts` | API 호출 | 경로만 맞추기 |
| `hooks.ts` | 서버 데이터 훅(목록 조회 — 진행 중이면 1초마다 갱신, 생성·취소·재시도·삭제)과 화면 훅(입력창 `useComposer`, 새 줄 표시 `useFreshIds`, 누를 수 있는 줄 `selectable`) | 유지 |
| `types.ts` | 작업·양식 타입 | 백엔드 명세에 맞춰 수정 |
| `utils.ts` | 상태 해석(`normalizeJobStatus`), 오류 문구, 포맷 | 유지 |
| `components/parts.tsx` | 상태 배지·진행 문구·미리보기 종이·작업 버튼·삭제 확인·선택 칩 | 유지 |
| `components/icons.tsx` | 아이콘 | 유지 |
| `pages/DocGenPage.tsx` | 화면 | 유지 |
| `src/mock/handlers/docgen.ts` | `npm run dev:mock`용 가짜 API. 결과 무작위(완료·실패·취소) | 명세에 맞춰 응답 모양만 수정 |

## 남은 일

1. 백엔드가 준비되면 `types.ts`·`api.ts` 경로와 `src/mock/handlers/docgen.ts` 응답을 명세에 맞춘다.
2. 다운로드 버튼(`DownloadButton`)에 다운로드 엔드포인트를 연결한다.
