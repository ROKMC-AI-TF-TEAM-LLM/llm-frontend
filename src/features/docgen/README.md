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

## 문서 스튜디오 (`/studio`)

사이드바 "문서 스튜디오" 탭. 발표 자료(PPTX)와 문서(HWPX·PDF)를 같은 흐름으로 만들고 고친다.

```
홈(/studio)                         편집기(/studio/:id)
요청 → 개요 확인·편집 → 만들기  →   쪽·장 목록 | 캔버스(부분 고르기) | 수정 기록·수정 요청 | 발표 보기
```

- **버전 = 작업(job)**: 수정 요청도 새 작업이다. 같은 문서의 작업은 `root_job_id`로 묶이고 `version` 순으로 쌓인다.
  그래서 목록 갱신·진행 표시·취소·재시도를 문서 생성과 똑같이 쓴다.
- **결과는 구조로**: `result.pages`(쪽·장 배치와 내용). 썸네일·캔버스·발표 보기가 모두 이 구조를 그린다(`features/studio/PageView.tsx`).

| 위치 | 하는 일 |
| --- | --- |
| `features/studio/hooks.ts` | 요청(`useStudioComposer`: 종류·양식·형식·개요), 문서 한 건의 버전(`useStudioDoc`), 홈 작업 목록(`useStudioWorks`) |
| `features/studio/PageView.tsx` | 쪽·장 그리기(16:9 장 / A4 쪽). 실제 크기로 그린 뒤 상자에 맞춰 줄인다. 부분(제목·표…) 고르기 |
| `features/studio/components.tsx` | 종류 전환, 개요 편집, 작업 카드 |
| `pages/studio/StudioHomePage.tsx` · `StudioEditorPage.tsx` | 홈 · 편집기 |

### 백엔드와 맞출 것 (TODO)

1. `POST /docgen/outlines` → `{ title, items: [{ title, points, layout }] }` (개요만 먼저, 가볍게)
2. `POST /docgen/jobs`에 `outline` 필드 추가 (사용자가 고친 개요대로 만들기)
3. 작업 결과에 `result.pages` (배치: `cover · bullets · two-column · table · chart · text`)
4. `POST /docgen/jobs/:id/revisions` `{ instruction, page_id, element }` → 새 버전 작업 (`root_job_id`, `parent_job_id`, `version`)
5. 작업에 `kind`(`doc`·`deck`), 양식에 `kind`, 출력 형식에 `PPTX`
6. 미리보기를 서버가 장별 이미지로 줄지, 지금처럼 `pages`를 프론트가 그릴지 결정

목 서버(`docgenMock.ts`)의 수정 요청은 문장 속 낱말(표·그래프·두 단·짧게·추가·삭제)로 바꿀 내용을 흉내 낸다.
문서 생성 시안(`/docgen/vN`)을 열면 목 작업이 모두 비워지므로 스튜디오에서 만든 것도 사라진다.

## 시안을 정한 뒤

1. 고른 `DraftVn.tsx`를 `src/pages/docgen/DocGenPage.tsx`로 옮긴다.
2. 그 파일에서 `DraftBar`와 `useFreshDraft()`(시안을 열 때마다 목 작업을 비우는 훅)를 지운다.
3. `App.tsx`의 `DOCGEN_DRAFTS` 라우트를 `/docgen` 하나로 바꾸고 `drafts` 폴더를 지운다.
4. 백엔드가 준비되면 `types`·`services` 경로를 맞추고 `VITE_DOCGEN_MOCK=false`, `docgenMock.ts`를 지운다.
5. 다운로드 버튼(`DownloadButton`)에 다운로드 엔드포인트를 연결한다.
