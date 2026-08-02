# 프론트 코드 이해하기 — 7월 29일판

# MARS 프론트엔드 코드 가이드 (2026년 7월 29일판)

> 이 문서는 MARS(해병대 RAG 챗봇) 프론트엔드 코드를 **처음부터 끝까지 읽어가며 이해**하도록 만든 가이드입니다.
> 위에서 아래로 순서대로 읽으면 "어디에 무엇이 있고, 데이터가 어떻게 흐르는지"가 잡히도록 구성했습니다.
> 파일 경로는 모두 `src/` 기준입니다.
>
> **7월 초판(`FRONTEND_GUIDE_2026-07.md`)과의 관계**: 구조의 큰 뼈대(인증·SSE·Zustand·React Query)는 그대로입니다.
> 이 문서는 7월 초판 이후 **7월 22~29일 사이에 새로 생기거나 크게 바뀐 부분**을 🆕 / 🔄 로 표시합니다.
> 7월 초판을 읽으셨다면 **0.5장만 따라가도** 그동안의 변화를 다 잡을 수 있습니다.

---

## 0. 읽는 순서 (추천)

1. **0.5장**: 7월 초 → 7월 말 변경 요약 (이미 초판을 읽었다면 여기만 봐도 됨)
2. **A장**: 관리자 문서 관리 기능 (이번 판의 가장 큰 신규)
3. **B장**: 도메인(Capabilities) 계층 — 하드코딩에서 서버 파생으로
4. **C장**: 메시지 커서 페이지네이션 (과거 메시지 무한 로드)
5. **D장**: 공용 다운로드 유틸 (fetch→blob 인증 다운로드)
6. **E장**: 자주 만지는 부분 / 아직 안 끝난 것 (갱신본)

> 4~14장(인증·SSE·chatStore·상태관리·스타일 등)은 7월 초판에서 바뀐 게 없으니 **초판을 그대로 참고**하세요.

---

## 0.5 🆕 7월 초 → 7월 말 무엇이 바뀌었나 (요약)

| # | 변경 | 핵심 파일 | 왜 |
| --- | --- | --- | --- |
| 1 | **관리자 문서 관리 기능 신규** | `pages/AdminDocuments.tsx`, `api/services/adminDocument.ts`, `hooks/useAdminDocument.ts`, `types/adminDocument.ts` | 관리자가 RAG 근거 문서를 **업로드·조회·삭제**하고 색인 상태를 본다 |
| 2 | **AdminPage 탭 구조 도입** | `pages/AdminPage.tsx` | 한 화면에서 **회원 관리 / 문서 관리**를 탭으로 전환 |
| 3 | **색인 상태 정규화 + 조건부 폴링** | `utils/document.ts`(`normalizeDocStatus`), `hooks/useAdminDocument.ts` | 서버 status(`queued`/`COMPLETED`…) 표현차 흡수 + 처리 중일 때만 5초 폴링 |
| 4 | **도메인(Capabilities) 서비스 계층** | `api/services/capability.ts`, `hooks/useCapabilities.ts`, `types/capability.ts` | 도메인 목록을 목업이 아닌 **서버(GET /capabilities)**에서 받도록 배선 |
| 5 | **도메인 검색 UI(`DomainPicker`)** | `ui/components/chat/DomainPicker.tsx`, `DomainIcon.tsx` | 챗 인풋에서 **검색 도메인 선택** |
| 6 | **메시지 커서 페이지네이션** | `api/services/chat.ts`(`getMessages`), `types/chat.ts` | 대화 메시지를 **과거 방향으로 커서** 로드(`limit`+`cursor`) |
| 7 | **공용 인증 다운로드 유틸** | `utils/downloadAttachment.ts`(`downloadFileWithAuth`) | 채팅 첨부·RAG 원본을 **fetch→blob**으로 인증 다운로드 (공용 코어로 통합) |
| 8 | **디자인 개편 & 텍스트 정비** | `sidebar/*`, `pages/LoginPage.tsx`, `NewChatPage.tsx`, `global.css` | 사이드바·로그인·새 채팅 화면 톤 통일 |

> **8월 예정(미완)**: 관리자 도메인 필터·업로드 드롭다운을 Capabilities 기반으로 완전 전환, 색인 워커(백엔드) 안정화. → E장 참고.

---

## A. 🆕 관리자 문서 관리 기능

관리자가 MARS의 **답변 근거 문서(RAG)** 를 직접 관리하는 화면. 이번 판의 가장 큰 신규 기능이다.

### A.1 4계층 구조 (다른 기능과 동일한 패턴)

```
types/adminDocument.ts     ← DTO 타입 (업로드/목록/상태/삭제 응답)
      ↓
api/services/adminDocument.ts  ← 엔드포인트 래퍼(얇은 층)
      ↓
hooks/useAdminDocument.ts  ← React Query 훅(목록 폴링/업로드/삭제 뮤테이션)
      ↓
pages/AdminDocuments.tsx   ← 화면(업로드 존 + 필터 + 목록 테이블)
```

### A.2 엔드포인트 (`api/services/adminDocument.ts`)

| 함수 | 엔드포인트 | 비고 |
| --- | --- | --- |
| `uploadAdminDocument(file, fields)` | `POST /api/v1/admin/documents` | **multipart/form-data**. `Content-Type: undefined`로 둬서 axios가 boundary 자동 설정. 타임아웃 120초(파일 전송 대비) |
| `getAdminDocuments(params?)` | `GET /api/v1/admin/documents` | 목록. `offset/limit/domain/search` 파라미터 |
| `getAdminDocumentStatus(id)` | `GET /api/v1/admin/documents/{id}/status` | 개별 상태(현재 화면은 목록 폴링으로 대체) |
| `deleteAdminDocument(id)` | `DELETE /api/v1/admin/documents/{id}` | **멱등** — 재시도 안전 |

> **왜 업로드만 `Content-Type: undefined`인가?** FormData를 보낼 때 브라우저/axios가 `multipart/form-data; boundary=...`를 자동으로 붙여야 한다. 우리가 헤더를 직접 지정하면 boundary가 빠져서 서버가 파싱을 못 한다. 그래서 **"직접 정하지 말고 비워라"** 는 의미로 `undefined`.

### A.3 훅 — 조건부 폴링이 핵심 (`hooks/useAdminDocument.ts`)

```ts
useQuery({
  queryKey: ['admin', 'documents', params],
  queryFn: () => getAdminDocuments(params),
  enabled: !!accessToken,
  // 색인 진행 상태 폴링 — useServerStatus(헬스체크)와 같은 조건부 방식
  refetchInterval: (query) => {
    if (query.state.status === 'error') return false          // ① 실패하면 정지(죽은 서버 그만 때리기)
    const docs = query.state.data?.data.data.documents ?? []
    const hasProcessing = docs.some(d => normalizeDocStatus(d.status) === 'processing')
    return hasProcessing ? 5000 : false                        // ② 처리 중 있으면 5초, 없으면 정지
  },
})
```

**설계 의도** (사용자 요구 그대로):
- **문서별 status API를 개별 호출하지 않는다.** 목록 API **1회 호출**로 전체 문서의 최신 상태를 한 번에 받는다(배치). 틱당 요청은 항상 1개.
- **처리 중 문서가 하나도 없으면 폴링 자체가 멈춘다.** 완료된 문서에는 호출이 안 나간다.
- 요청 실패·탭 백그라운드·탭 이탈 시에도 자동 정지 → **불필요한 API 폭주 방지.**

업로드/삭제 뮤테이션은 성공 시 `invalidateQueries(['admin','documents'])`로 목록을 갱신해 **새 문서(처리 중)가 즉시 보이게** 한다.

### A.4 화면 (`pages/AdminDocuments.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│ MARS가 답변 근거로 사용할 문서를 업로드하세요             │
├──────────────────────────────────────────────────────────┤
│ ⬆ 파일을 여기로 끌어다 놓거나 클릭해 업로드   [인사·복지▾] [파일 선택] │  ← 드래그앤드롭 존
├──────────────────────────────────────────────────────────┤
│ [전체] 처리 중  완료  실패              [🔍 파일명 검색...] │  ← 상태 필터 + 검색
├──────────────────────────────────────────────────────────┤
│▌📄 경비규정.txt  TXT·3.8KB   인사·복지  해병대  처리중  …  [삭제] │
└──────────────────────────────────────────────────────────┘
```

- **업로드 존**: 드래그앤드롭 + 클릭. 우측 도메인 드롭다운에서 코드 선택 후 전송.
- **상태 필터**: 전체/처리 중/완료/실패 — `normalizeDocStatus`로 매칭(A.5).
- **목록 행**: 좌측 도메인 색 막대(`getDomainStyle` 해시) + 파일명/타입/크기 + 도메인 아이콘·라벨 + 상태 배지 + 삭제.
- **에러 표시**: 목록 실패 시 `[상태코드] 원인`을 함께 노출(`getApiError` + `DEFAULT_STATUS_ERRORS`). CORS로 상태코드를 못 받으면 "서버에 연결할 수 없습니다".

### A.5 ⭐ 상태 정규화 — `normalizeDocStatus` (`utils/document.ts`)

**문제**: 서버가 주는 status 문자열이 코드가 기대한 것과 다르다. 실제로 `"queued"`(소문자)가 왔고, 대문자 `PROCESSING`과 비교하던 로직이 전부 "처리 중"으로만 떨어졌다.

**해결**: 표현 차이를 흡수하는 정규화 함수 하나로 통일.

```ts
export type DocIndexStatus = 'completed' | 'failed' | 'processing'
export const normalizeDocStatus = (status) => {
  const s = String(status ?? '').toLowerCase()
  if (/(complete|success|done|indexed|ready|\bok\b)/.test(s)) return 'completed'
  if (/(fail|error|reject|cancel)/.test(s)) return 'failed'
  return 'processing'   // queued/pending/running/indexing 등 진행 상태
}
```

이 함수 하나를 **배지 표시·필터·폴링 중단 조건**이 전부 공유한다. 서버가 status 표현을 바꿔도 한 곳만 고치면 된다.

> **교훈**: 외부(서버)가 주는 열거값은 **그대로 `===` 비교하지 말고 정규화 계층을 한 겹** 둔다. 대소문자·동의어·미래 값에 견고해진다.

---

## B. 🆕 도메인(Capabilities) 계층 — 하드코딩에서 서버 파생으로

7월 초판에서 도메인은 `mocks/ragDocuments.ts` **목업**이었다. 이제 서버에서 받는 계층이 생겼다.

| 파일 | 역할 |
| --- | --- |
| `types/capability.ts` | Capabilities 응답 DTO |
| `api/services/capability.ts` | `GET /api/v1/capabilities` 래퍼 |
| `hooks/useCapabilities.ts` | React Query 훅 |
| `ui/components/chat/DomainPicker.tsx` | 챗 인풋의 도메인 선택 UI |
| `ui/components/chat/DomainIcon.tsx` | 도메인 코드별 아이콘(모르는 코드는 기본 문서 아이콘) |

**도메인 값 매핑** (`utils/document.ts`의 `DOMAINS`):

| 코드 | 한글 라벨 |
| --- | --- |
| `HR` | 인사·복지 |
| `TECH` | 정보화·보안 |
| `FINANCE_LEGAL` | 재무·법무 |
| `GENERAL` | 일반 |
| `MANUAL` | 교범 |
| `DIRECTIVE` | 훈령 |

- **라벨**: `getDomainLabel(code)` — 모르는 코드는 **코드 그대로** 표시(백엔드가 도메인을 추가해도 안 깨짐).
- **색상**: `getDomainStyle(code)` — 문자열 해시로 8색 팔레트에서 **결정적 배정**(같은 도메인은 항상 같은 색).

> ⚠️ **관리자 화면은 아직 절반만 서버 파생이다.** 목록 라벨/색은 새 도메인에 대응하지만, **업로드 드롭다운과 도메인 필터는 여전히 `DOMAINS` 6개 하드코딩**이다. → E장 참고.

---

## C. 🆕 메시지 커서 페이지네이션 (`api/services/chat.ts`)

대화 메시지를 **과거 방향으로** 나눠 로드한다.

```ts
// 커서 페이지네이션: cursor 없으면 최신 페이지, 있으면 그 지점부터 과거 방향으로 limit개.
// 서버 파라미터 이름은 limit (스웨거 기준, 기본 20 / 1~100).
getMessages(sessionId, { params: { limit, cursor } })
// 응답: { items, next_cursor, has_next }
```

| 요청 파라미터 | 응답 필드 |
| --- | --- |
| `limit` (❗ `size` 아님) | `items[]` |
| `cursor` (없으면 최신부터) | `next_cursor` (다음 페이지 커서) |
|  | `has_next` (더 있는지) |

> **주의**: 파라미터 이름이 세션 목록(`size`)과 달리 **`limit`** 이다. 스웨거 기준을 그대로 따른다. 응답도 `items`/`next_cursor`/`has_next` 형태.

---

## D. 🔄 공용 인증 다운로드 유틸 (`utils/downloadAttachment.ts`)

인증(Authorization 헤더)이 필요한 파일 다운로드를 **공용 코어 하나로 통합**했다.

```ts
// <a href> 직접 링크로는 헤더를 못 실으므로 fetch→blob→가짜 링크 클릭으로 저장한다.
export const downloadFileWithAuth = async (url, filename) => {
  const token = await getValidAccessToken()
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) return '파일을 찾을 수 없습니다.'
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: objectUrl, download: filename })
  a.click(); a.remove(); URL.revokeObjectURL(objectUrl)   // 메모리 누수 방지
  return null   // 성공은 null, 실패는 사용자용 메시지
}
```

**세 소비처가 이 코어를 공유**:
- `downloadAttachment(att)` — 채팅 SSE `files` 이벤트 첨부
- `downloadDocumentByName(name)` — RAG 원본 문서(`GET /api/v1/documents/{name}/download`, 한글은 `encodeURIComponent`)
- (관리자 목록의 다운로드 버튼은 이후 제거됨 — 삭제만 유지)

> **왜 `<a href>`로 못 받나?** 링크 클릭은 헤더를 못 붙인다. 인증이 필요한 파일은 반드시 `fetch`로 토큰을 실어 받고, 받은 blob을 임시 URL로 만들어 가짜 링크를 클릭시키는 우회가 필요하다.

---

## E. 자주 만지는 부분 & 아직 안 끝난 것 (갱신본)

### E.1 자주 만지는 부분 (이번 판 추가분)

| 하고 싶은 것 | 파일 |
| --- | --- |
| 🆕 관리자 문서 업로드/목록/삭제 UI | `pages/AdminDocuments.tsx` |
| 🆕 문서 색인 폴링 주기·중단 조건 | `hooks/useAdminDocument.ts` |
| 🆕 문서 상태 표현 매핑(queued 등) | `utils/document.ts` `normalizeDocStatus` |
| 🆕 관리자 탭(회원/문서) 구성 | `pages/AdminPage.tsx` |
| 🆕 도메인 목록/라벨/아이콘 | `utils/document.ts`, `chat/DomainIcon.tsx` |
| 🆕 도메인 선택 UI | `chat/DomainPicker.tsx` |
| 🆕 메시지 커서 페이지네이션 | `api/services/chat.ts` `getMessages` |
| 🔄 인증 파일 다운로드 | `utils/downloadAttachment.ts` `downloadFileWithAuth` |

### E.2 🚧 관리자 문서 — 도메인 서버 파생 미완

**현재**: 관리자 업로드 드롭다운·도메인 필터가 `DOMAINS` **6개 하드코딩**. 서버가 새 도메인을 추가해도 그 도메인으로 **업로드할 선택지가 없고**, 관리자 화면엔 도메인 필터 탭 자체가 없다.

**할 일**: 업로드 드롭다운·필터를 `useCapabilities`(서버 도메인) 기반으로 전환. (RAG 페이지의 `extractDomains` 패턴 재사용)

### E.3 🚧 색인 상태 — 백엔드 워커 대기

업로드한 문서가 계속 `status: "queued"` 로 남아 있는 현상 확인됨(며칠 전 업로드분 포함). **프론트 폴링은 정상 동작**하며, 서버가 큐를 소비해 `completed`로 바꿔야 폴링이 멈춘다.

- **원인**: 백엔드 색인 워커/파이프라인이 큐를 처리하지 않음(또는 LLM 서버 연결 문제). 앞서 `GET /admin/documents`가 500 났던 것과 연관 가능.
- **프론트 조치 완료**: `queued`를 처리 중 계열로 정규화해 배지·필터·폴링이 정확히 동작.

### E.4 🚧 (기존 유지) 도메인 검색 UX 설계, 즐겨찾기 백엔드 필드

7월 초판 17장의 미완 항목(도메인 검색 세션/메시지 스코프 결정, 즐겨찾기 `is_favorite` 필드 확정)은 그대로 유효하다. 초판 참고.

---

> 이 문서는 **2026년 7월 29일 코드 기준 스냅샷**입니다. 7월 초판(`FRONTEND_GUIDE_2026-07.md`)과 6월판(`FRONTEND_GUIDE.md`)은 비교용으로 보관합니다.
> 파일을 크게 리팩터링하면 해당 장을 함께 갱신하세요.
