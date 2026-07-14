# 프론트 코드 이해하기 — 7월

# MARS 프론트엔드 코드 가이드 (2026년 7월판)

> 이 문서는 MARS(해병대 RAG 챗봇) 프론트엔드 코드를 **처음부터 끝까지 읽어가며 이해**하도록 만든 가이드입니다.
> 위에서 아래로 순서대로 읽으면 "어디에 무엇이 있고, 데이터가 어떻게 흐르는지"가 잡히도록 구성했습니다.
> 파일 경로는 모두 `src/` 기준입니다.
>
> **6월판과의 관계**: 구조의 큰 뼈대(인증·SSE·Zustand·React Query)는 그대로입니다.
> 대신 6월 이후 **새로 생기거나 크게 바뀐 부분**을 🆕 / 🔄 로 표시했으니, 6월판을 읽으셨다면 그 표시만 따라가도 됩니다.

---

## 0. 읽는 순서 (추천)

1. **0.5장**: 6월 → 7월 변경 요약 (이미 6월판을 읽었다면 여기만 봐도 됨)
2. **1~2장**: 무슨 앱인지 + 폴더 지도
3. **3장**: 앱이 어떻게 켜지고 라우팅되는지 (진입점)
4. **4~6장**: 핵심 3대 축 — ①인증 ②서버통신 ③채팅 스트리밍
5. **7장**: 상태관리 3종(Context/Zustand/React Query)이 각각 뭘 맡는지
6. **8~10장**: 훅/타입/유틸 (재사용 부품)
7. **11~14장**: 화면(페이지/레이아웃/컴포넌트/스타일)
8. **15장**: "실제 기능이 도는 흐름"을 시나리오로 따라가기
9. **16장**: 자주 고치는 부분 위치
10. **17장**: 아직 안 끝난 것 / 다음 할 일

---

## 0.5 🆕 6월 → 7월 무엇이 바뀌었나 (요약)

| # | 변경 | 핵심 파일 | 왜 |
| --- | --- | --- | --- |
| 1 | **즐겨찾기 기능 추가** | `hooks/useSession.ts`(`useToggleFavorite`), `sidebar/FavoriteChats.tsx` | 자주 쓰는 세션을 사이드바 상단에 고정 |
| 2 | **`SessionItem` 공용 컴포넌트 분리** | `sidebar/SessionItem.tsx` | '최근 대화'와 '즐겨찾기'가 **같은 행 동작**(별/수정/삭제)을 갖도록 |
| 3 | **`MessageRow` 분리 + `React.memo`** | `messages/MessageRow.tsx` | 스트리밍 중 **안 바뀐 메시지의 리렌더 차단**(성능) |
| 4 | **SSE `status` 이벤트 배선** | `services/chat.ts`, `chatStore.ts`(`statusText`) | "관련 문서를 선별하는 중..." 같은 **진행 상태 표시** |
| 5 | **문서(RAG) 페이지 전면 개편** | `pages/RagPage.tsx`, `rag/RagListItem.tsx`, `rag/RagDetail.tsx` | 카드 → **리스트 + 도메인 탭 + 우측 슬라이드 드로어** |
| 6 | **도메인(카테고리) 하드코딩 제거** | `mocks/ragDocuments.ts` | 도메인 목록·색상을 **서버 데이터에서 파생** |
| 7 | **`uuid()` 폴백 유틸** | `utils/uuid.ts` | 비보안 컨텍스트(HTTP+IP)에서 `crypto.randomUUID`가 없어 터지던 버그 |
| 8 | **`copyText()` 폴백 유틸** | `utils/clipboard.ts` | 같은 이유로 `navigator.clipboard`가 없을 때 복사 실패 |
| 9 | **스크롤 앵커링 정교화** | `messages/MessageList.tsx` | spacer + `getBoundingClientRect` 좌표계 통일로 스크롤 튐 해결 |

> **8월 예정(미완)**: 도메인별 문서 검색을 채팅에 연결(백엔드 필드 대기), 즐겨찾기 백엔드 필드 확정. → 17장 참고.

---

## 1. 프로젝트 개요 & 기술 스택

**MARS** = "Marine Artificial Intelligence Retrieval System". 해병대 법령·규정·규칙을 학습한 **RAG 챗봇**의 웹 프론트엔드.
백엔드(LLM/RAG 서버)는 별도이고, 프론트는 `VITE_SERVER_API_URL` 환경변수로 연결합니다.

| 영역 | 기술 | 용도 |
| --- | --- | --- |
| 빌드/런타임 | **Vite** + React **19** + TypeScript | SPA |
| 라우팅 | **react-router v7** | 페이지 전환, 코드 스플리팅 |
| 서버 상태 | **@tanstack/react-query v5** | 세션/유저/문서 목록 캐시·페이지네이션 |
| 클라이언트 상태 | **Zustand v5** | 채팅 스트리밍 상태(메시지/스트리밍/에러/진행상태) |
| REST 통신 | **Axios** | 일반 API + JWT 자동 갱신 |
| 스트리밍 | **fetch + SSE** | 채팅 토큰 단위 스트리밍(Axios 아님) |
| 폼 | **react-hook-form + zod** | 로그인/회원가입 검증 |
| 마크다운 | **streamdown** | AI 답변 스트리밍 렌더 |
| 스타일 | **Tailwind CSS v4** (+ `global.css` 디자인 토큰) | 전 UI |

**패키지 매니저**: pnpm. 스크립트: `dev`(vite), `build`(`tsc -b && vite build`), `lint`(eslint).

---

## 2. 디렉토리 구조 (한 줄 지도)

🆕 = 6월 이후 새로 생긴 파일

```
src/
├─ main.tsx                # 앱 부팅(ReactDOM 렌더 + Provider 장착)
├─ App.tsx                 # 라우터 정의(공개/보호/관리자 라우트)
│
├─ api/                    # ── 서버 통신 계층 ──
│  ├─ lib/axios.ts         #   Axios 인스턴스 + JWT 자동 갱신(핵심)
│  ├─ queryClient.ts       #   React Query 전역 클라이언트
│  ├─ services/            #   엔드포인트 래퍼(auth/chat/session/document/user/inquiry/health)
│  └─ store/chatStore.ts   #   채팅 스트리밍 Zustand 스토어(가장 큰 파일·핵심)
│
├─ constants/key.ts        # 스토리지 키 상수
├─ context/AuthContext.tsx # 전역 인증 Context + useAuth()
│
├─ hooks/                  # ── React Query 래퍼 + 유틸 훅 ──
│  ├─ useSession.ts        #   🔄 useToggleFavorite 추가(낙관적 업데이트)
│  ├─ useUser.ts useDocument.ts useServerStatus.ts
│  └─ useLocalStorage.ts useDocumentTitle.ts
│
├─ 🆕 mocks/ragDocuments.ts # 문서 목업 + 도메인 색상 파생(실제 API 붙기 전 대역)
│
├─ types/                  # 도메인 모델 + API DTO 타입
│  └─ index.ts chat.ts auth.ts session.ts user.ts document.ts inquiry.ts api.ts
│
├─ utils/
│  ├─ error.ts logError.ts chunkReload.ts
│  ├─ 🆕 uuid.ts           #   crypto.randomUUID 폴백 (비보안 컨텍스트 대응)
│  └─ 🆕 clipboard.ts      #   navigator.clipboard 폴백
│
├─ pages/                  # 라우트 화면
│  └─ LoginPage ChatPage NewChatPage SearchPage RagPage AdminPage ErrorPage
│
└─ ui/
   ├─ layouts/             # AuthLayout / ProtectedLayout / AdminLayout (라우트 가드+셸)
   ├─ styles/global.css    # 디자인 토큰(@theme) + 로그인화면(.mars-*) 스타일
   └─ components/
      ├─ MarsPlanet Toast Skeleton ErrorBoundary  (공통)
      ├─ chat/ChatInput
      ├─ messages/  MessageList 🆕MessageRow MessageBubble MessageActions
      │             ChatHeader SourceBadge ImageAttachment
      ├─ sidebar/   Sidebar SidebarHeader SidebarMenu RecentChats
      │             🆕SessionItem 🆕FavoriteChats SidebarFooter
      ├─ rag/       🆕RagListItem 🆕RagDetail RagSearchInput RagCard(잔재)
      └─ search/    SearchInput SearchResults SearchResultItem
```

---

## 3. 앱 부팅 & 라우팅

### 3.1 진입점 — `main.tsx`

```tsx
createRoot(#root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>   // React Query 전역
      <App />
    </QueryClientProvider>
  </StrictMode>
)
```

- 전역 CSS(`ui/styles/global.css`)와 streamdown CSS를 여기서 import.
- `window.addEventListener('vite:preloadError', tryReloadOnce)` — 새 배포로 코드 스플릿 청크가 stale 되어 로드 실패하면 **자동 새로고침 1회**로 복구(`utils/chunkReload.ts`).

### 3.2 라우터 — `App.tsx`

`<AuthProvider>`로 전체를 감싼 뒤 `createBrowserRouter`로 라우트 트리를 만든다. (6월과 동일)

```
publicRoutes:                        protectedRoutes:
 AuthLayout                            ProtectedLayout (사이드바 셸 + 로그인 가드)
  └ "/"  → LoginPage                    ├ "/chat"       → NewChatPage
                                        ├ "/chat/:id"   → ChatPage
                                        ├ "/search"     → SearchPage  (lazy + Suspense)
                                        ├ "/rag"        → RagPage     (lazy + Suspense)
                                        └ AdminLayout
                                            └ "/admin"  → AdminPage   (lazy + Suspense)
 "*" → ErrorPage
```

- **레이아웃 = 라우트 가드 + 공통 셸.** 각 레이아웃이 로그인/권한 여부를 확인하고 `<Outlet/>`으로 자식 페이지를 렌더.
- **코드 스플리팅**: Search/Rag/Admin 은 `lazy()` + `<Suspense fallback={스켈레톤}>`으로 지연 로드.

---

## 4. 인증(Auth) 아키텍처 — 6월과 동일

> 이 장은 6월판에서 **바뀐 게 없습니다.** 이미 읽으셨다면 건너뛰어도 됩니다.

토큰은 두 군데에 나눠 저장:
- **access token → `sessionStorage`** (탭 닫으면 사라짐, 수명 짧음)
- **refresh token → `localStorage`** (오래 유지)

### 4.1 `context/AuthContext.tsx`
`useAuth()` → `{ accessToken, refreshToken, login, logout }`. 로그인 시 토큰 저장 + `scheduleTokenRefresh()`.

### 4.2 `api/lib/axios.ts` (JWT 자동화의 심장)

| 함수 | 역할 |
| --- | --- |
| `decodeTokenExp` / `isTokenExpired` | JWT payload의 `exp` 디코드(base64url) → 만료(5초 여유) 판단 |
| **`refreshTokenOnce()`** | `pendingRefresh` 프로미스로 **동시 갱신을 1건으로 합침**(single-flight) |
| `scheduleTokenRefresh()` | 만료 **60초 전** 선제 갱신 예약 |
| `getValidAccessToken()` | **SSE(fetch)용** — 인터셉터를 안 타므로 별도 헬퍼 필요 |
| 요청 인터셉터 | 만료 임박이면 갱신 후 `Authorization: Bearer` 자동 부착 |
| 응답 인터셉터 | `401` → 갱신 후 **원요청 1회 재시도**(`_retry` 플래그로 무한루프 방지) → 그래도 실패면 로그아웃 |

> 정리: "토큰 붙이기/갱신/401 복구"는 전부 여기서 자동 처리. 각 service 파일은 순수하게 URL만 호출하면 됨.

---

## 5. 서버 통신 계층 `api/`

### 5.1 `queryClient.ts`
`staleTime 60s`, `retry 1`. 모든 쿼리/뮤테이션 에러를 `logError`로 콘솔 집계.

### 5.2 `api/services/*` — 엔드포인트 래퍼(얇은 층)

| 파일 | 주요 함수 | 비고 |
| --- | --- | --- |
| `auth.ts` | `login/signup/logout/refresh` | `/api/v1/auth/*` |
| `session.ts` | `getSessions(cursor)/createSession/searchSessions/updateSession/deleteSession` | 커서 페이지네이션. 🔄 `updateSession`이 **부분 수정**(title / is_favorite) |
| `document.ts` | `getDocuments`, `pickDocuments` | 응답 형태 불안정 대비 정규화 + 30s 타임아웃 |
| `user.ts` | `getMeUsers`, 관리자 `getUsers/approveUser/rejectUser/deleteUsers/inquiryUsers` | |
| `inquiry.ts` | 문의 CRUD + 관리자 답변 | multipart 포함 |
| `health.ts` | `getHealth` → `{ db, llm_server }` | 서버 상태 점 |
| **`chat.ts`** | `getMessages/deleteMessage` + **`streamMessage`/`regenerateMessageStream`** | 아래 5.3 |

### 5.3 🔄 `api/services/chat.ts` — SSE 스트리밍

채팅 응답은 **토큰 단위 스트리밍**이라 Axios 대신 `fetch`를 쓴다.

- **`postSse(url, body, signal)`**: `getValidAccessToken()`으로 토큰 붙여 POST. `401`이면 `refreshTokenOnce()` 후 1회 재시도, 그래도 실패면 토큰 삭제 + `/` 이동.
  > **왜 EventSource를 안 쓰나?** 표준 `EventSource`는 **GET만 되고 헤더를 못 붙인다.** 우리는 **POST + `Authorization` 헤더**가 필요해서 `fetch` + `ReadableStream`으로 직접 SSE를 읽는다.
- **`readSse(response, handlers)`**: 응답 body를 reader로 읽으며 `data:` 라인을 파싱.

**🆕 SSE 이벤트 종류 (7월에 `status` 추가):**

| 이벤트 | 처리 |
| --- | --- |
| 텍스트 토큰 (type 없음/`text`/`token`/`chunk`/`answer`) | `onChunk(text)` → 답변 본문에 이어붙임 |
| `{type:'sources'}` | `onSources(items)` → 출처 뱃지 |
| **🆕 `{type:'status', message}`** | **`onStatus(message)` → "관련 문서를 선별하는 중..." 같은 진행 상태 표시.** 답변 본문이 아니므로 `onChunk`가 아님 |
| `{type:'error'}` | throw |
| `{type:'done'}` | 완료 신호 |

**버퍼링 주의**: 네트워크 조각은 줄 단위로 안 잘린다(`data: 안녕하` 에서 끊길 수 있음). 그래서 `buffer`에 모아 **완성된 줄(`\n`)만 처리**하고 마지막 미완성 조각은 남겨둔다.

- **idle 타임아웃**(`VITE_STREAM_IDLE_MS`, 기본 20분) 동안 무응답이면 `reader.cancel()`로 중단.
- `streamMessage`(일반 전송)와 `regenerateMessageStream`(재생성)이 **같은 SSE 형식**을 공유.

---

## 6. 채팅 스트리밍 엔진 — `api/store/chatStore.ts` (핵심·최대 파일)

Zustand 스토어. **채팅 화면의 모든 상태와 스트리밍 로직의 중심**. 여기만 이해하면 채팅 동작 90%는 이해된 것.

### 6.1 상태

`sessionId, messages[], isStreaming, error, isDeleted, abortController` + **🆕 `statusText`**

> **🆕 `statusText`**: SSE `status` 이벤트로 받은 진행 상태 문자열(예: "관련 문서를 선별하는 중...").
> 스트리밍 중 답변이 아직 안 나올 때 이걸 대신 보여준다. 첫 토큰이 도착하면 `null`로 지운다(`chatStore.ts:179`).

### 6.2 내부 메커니즘

- **`createWriter(sessionId, assistantId)`**: SSE 토큰을 **~60ms throttle**로 모아 in-place 갱신(재렌더 폭발 방지).
  - 사용자가 텍스트를 **드래그 선택 중이면 업데이트를 잠시 보류**(복사 가능하게).
  - `push` / `flushNow`(마지막 조각 즉시 반영) / `setSources` 제공.
  - **클로저**로 `buffer`·`flushTimer`를 스트림마다 격리 → 여러 스트림이 안 섞임.
- **`executeStream(...)`**: `streamMessage` 호출 → 성공/실패/빈응답 분기.
  - **빈 응답**(내용 0) = 백엔드 LLM 생성 실패로 간주 → 에러 표시 + 질문·빈답 정리.
  - 실패 시 낙관적으로 추가했던 (질문,답) 쌍 롤백, 첫 메시지 실패면 빈 세션까지 삭제.
- **`executeRegenerate(...)`**: 재생성 SSE. 실패/빈응답이면 해당 답변을 `interrupted` 상태로.
- **`cleanupEmptyExchange(...)`**: 백엔드에 남은 "질문+빈답" 쌍을 조회해 삭제(새로고침 시 되살아나지 않도록). 빈 세션이면 세션까지 삭제.
- **`extractContent(raw)`**: 서버 값이 중첩 JSON(`{content:{answer:...}}`)일 수 있어 **재귀적으로** 실제 텍스트만 뽑아냄(깊이 5 제한 = 무한 재귀 방어).

### 6.3 ⭐ Race Condition 방어 (세션 이동 대비)

스트리밍은 수 초 걸리는데 그 사이 사용자가 다른 세션으로 이동할 수 있다. **늦게 도착한 응답이 지금 보고 있는 화면을 덮으면 안 된다.**

```ts
// 토큰을 반영하기 직전, "아직도 그 세션인가?"를 확인
if (get().sessionId !== sessionId) {
  streamRegistry.set(sessionId, ...)   // 화면 말고 백그라운드 저장소에만 기록
  return                                // 현재 화면은 건드리지 않음
}
```
- 시작 시점의 `sessionId`를 **클로저에 붙잡아** 두고, 반영 직전 `get().sessionId`(현재값)와 비교 → **stale 체크**.
- 세션 이동 시엔 아예 `connectAbortController.abort()`로 **이전 요청을 취소**.

### 6.4 캐시·복원 (새로고침/재접속 견고성)

| 저장소 | 키 | 역할 |
| --- | --- | --- |
| `streamRegistry` (메모리) | sessionId | **다른 세션으로 이동해도 백그라운드 스트림 이어받기** |
| `messageCache` (메모리) | sessionId | 세션 재방문 시 즉시 표시 |
| `sessionStorage` | `rokm_cache_*` | 새로고침 대비 캐시 (`beforeunload`에서도 저장) |
| `sessionStorage` | `rokm_inflight` | **"보냈는데 아직 답 못 받은 질문"** → 재접속 시 `retryLastMessage`로 자동 재시도 |

### 6.5 액션(컴포넌트가 호출)

| 액션 | 설명 |
| --- | --- |
| `connect(sessionId)` | 세션 진입: 스트림 이어받기/캐시/서버 메시지 로드 + 정렬·dedup + inflight 재시도 |
| `disconnect()` | 상태 초기화 |
| `sendMessage(content)` | 낙관적으로 (질문+빈 답) 추가 후 `executeStream` |
| `retryLastMessage()` | 마지막 user 질문으로 재스트리밍 |
| `regenerateMessage(assistantId)` | 그 답변의 원본 질문을 찾아 재생성(서버 답변 못 찾으면 재전송 폴백) |
| `abortStream()` | 진행 중 스트림 중단 |
| `clearCache(sessionId)` | 세션 캐시 제거 (세션 삭제 시 `SessionItem`이 호출) |

> **재생성/편집 규칙**: 원본 Q&A를 in-place로 고치지 않고, **맨 아래 어시스턴트 메시지에만** 재생성 버튼 노출.

---

## 7. 상태관리 3종 — 역할 분담 (6월과 동일)

| 도구 | 담당 | 위치 |
| --- | --- | --- |
| **React Context** | 인증(토큰, login/logout) | `context/AuthContext` |
| **React Query** | 서버 목록 데이터(세션/유저/문서/헬스) 캐시·무한스크롤 | `hooks/*` |
| **Zustand** | 채팅 실시간 스트리밍 상태 | `api/store/chatStore` |

핵심: "채팅 스트리밍"은 초 단위로 바뀌고 낙관적 업데이트가 많아 Query 대신 Zustand, "목록류"는 캐시/무효화가 중요해 Query, "인증"은 앱 전역이라 Context.

> **왜 즐겨찾기는 Zustand가 아니라 React Query인가?**
> 즐겨찾기는 **서버가 주인인 데이터**(세션의 속성)라서 React Query가 맞다. 클라이언트가 실시간으로 만들어내는 값이 아니다.

---

## 8. 훅 `hooks/`

- **🔄 `useSession.ts`**: `useInfiniteSessions`(커서 무한스크롤), `useCreateSession`, `useSearchSessions`, `useUpdateSession`, `useDeleteSession`, **🆕 `useToggleFavorite`**.
- **`useUser.ts`**: `useGetMe`(내 정보), 관리자용 `useInfiniteUsers/useGetUsers/useApproveUser/useRejectUser/useDeleteUsers/useInquiryUsers`.
- **`useDocument.ts`**: `useInfiniteDocuments`(문서 무한스크롤, `has_more` + 누적 offset).
- **`useServerStatus.ts`**: 헬스 폴링 → `'checking'|'ok'|'error'`.
- **`useLocalStorage.ts`**: local/session 스토리지 get/set/remove 래퍼(JSON, try/catch).
- **`useDocumentTitle.ts`**: 문서 타이틀 `"제목 - MARS"` 설정, 언마운트 시 복원.

### 🆕 8.1 `useToggleFavorite` — 낙관적 업데이트의 교과서

즐겨찾기 별은 **누르는 즉시 켜져야** 한다(서버 왕복을 기다리면 굼떠 보임). 그래서 **낙관적 업데이트 + 롤백**을 쓴다.

```ts
useMutation({
  mutationFn: ({ sessionId, next }) =>
    updateSession(sessionId, { is_favorite: next }),   // 새 API 안 팜! 기존 PATCH 재사용

  // ① 요청 '직전': 캐시를 먼저 바꾸고(즉각 반응) 롤백용 스냅샷을 남긴다
  onMutate: async ({ sessionId, next }) => {
    await queryClient.cancelQueries({ queryKey: ['sessions'] })  // ★ 진행 중 refetch 취소
    const prev = queryClient.getQueryData(SESSIONS_INFINITE_KEY) // 백업
    queryClient.setQueryData(SESSIONS_INFINITE_KEY, (old) => /* 불변성으로 교체 */)
    return { prev }
  },

  // ② 실패하면 스냅샷으로 되돌린다 (롤백)
  onError: (_e, _v, ctx) => queryClient.setQueryData(SESSIONS_INFINITE_KEY, ctx.prev),

  // ③ 성공/실패 무관하게 서버 기준으로 재동기화
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
})
```

**`cancelQueries`가 왜 중요한가**: 진행 중이던 세션 목록 refetch가 **나중에 도착해 내 낙관적 변경을 덮어쓰는** race condition을 막는다. (6.3의 stale 체크와 같은 문제, 다른 해법)

**무한 쿼리 캐시 구조 주의**: `useInfiniteSessions`의 캐시는 `pages[].data.data.items[]` 3중 중첩이라, 캐시 수정 시 모든 층을 **불변성으로 새로 만들어야** 한다.

---

## 9. 타입 `types/`

- **`index.ts`** = 프론트 도메인 모델.
  - `Message` 유니온: `UserMessage` / `AssistantMessage`(**status: streaming|done|interrupted**, sources?) / `ImageMessage`.
  - 🔄 **`ChatItem`에 `isFavorite?: boolean` 추가** (사이드바 세션 항목).
- **`chat.ts`**: 서버 DTO. 서버 role은 `'human'|'ai'` → 프론트 `'user'|'assistant'`로 chatStore가 변환.
- **🔄 `session.ts`**: `SessionData`에 **`is_favorite?`** 추가. `UpdateSessionRequest`는 **부분 수정**을 위해 `title?` / `is_favorite?` 둘 다 optional.
- **`document.ts`**: `DocumentItem { name, type?, applied_at? }`. 응답 키가 환경에 따라 `items`/`documents`로 달라 둘 다 옵셔널.
- **`api.ts`**: 공통 응답 래퍼 `{success, status_code, data, error}`.

> **⚠️ 타입 확장 원칙**: 새 필드는 **반드시 optional(`?`)** 로 추가하라. 기존 데이터/호출부가 안 깨지고, 프론트·백엔드 배포 시점이 달라도 공존 가능하다. 읽는 쪽은 `?.`/`??`로 방어.

---

## 10. 유틸 `utils/`

- **`error.ts`**: `getApiError(error, codeMap, statusMap, fallback)` — 백엔드 `error.code` → HTTP status → fallback 순으로 사용자 메시지 매핑.
- **`logError.ts`**: 일관 콘솔 로깅. **끄고 싶으면 이 함수 본문만 비우면 전체 무음.**
- **`chunkReload.ts`**: 코드 스플릿 청크 로드 실패 시 10초 내 1회만 새로고침.

### 🆕 10.1 `uuid.ts` / `clipboard.ts` — "보안 컨텍스트" 대응

**이 둘은 같은 원인에서 나온 형제 파일이다.**

브라우저의 일부 기능은 **Secure Context(HTTPS 또는 localhost)** 에서만 제공된다.
사내망 IP(`http://172.16.3.205`)로 접속하면 Secure Context가 **아니라서** 아래 API가 통째로 `undefined`가 된다:

| API | 증상 | 해결 파일 |
| --- | --- | --- |
| `crypto.randomUUID()` | `TypeError: is not a function` → **메시지 전송 자체가 죽음** | 🆕 `utils/uuid.ts` |
| `navigator.clipboard` | 복사 버튼이 조용히 실패 | 🆕 `utils/clipboard.ts` |

```ts
// uuid.ts — 있으면 쓰고, 없으면 crypto.getRandomValues로 직접 RFC4122 v4 생성
const c = globalThis.crypto
if (c?.randomUUID) return c.randomUUID()
// ... 16바이트 난수 + version/variant 비트 세팅 ...
```
```ts
// clipboard.ts — 있으면 표준 API, 없으면 임시 textarea + execCommand 폴백
if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text)
// ... textarea 만들어 select() + execCommand('copy') ...
```

> **교훈**: "localhost에선 되는데 배포하면 죽는" 버그를 만나면 **`window.isSecureContext`** 부터 확인하라.
> 최신 브라우저 API는 **존재 확인(`?.`) 후 사용 + 폴백**을 습관화.

---

## 11. 페이지 `pages/`

- **`LoginPage.tsx`** (랜딩+인증, UI가 가장 복잡): 스크롤 인트로(히어로/특징/사용법/CTA) + "시작하기" 클릭 시 오른쪽 로그인 패널 슬라이드 인. `view: 'intro'|'auth'`, `mode: 'login'|'signup'`, react-hook-form+zod. 스타일은 `global.css`의 `.mars-*`.
- **`ChatPage.tsx`** (`/chat/:id`): `chatStore.connect(sessionId)` → `MessageList` + `ChatInput`. 세션없음/권한/서버오류 분기, 삭제된 세션이면 `/chat`로 이동(toast). 새 채팅에서 넘어온 `initialMessage` 처리.
- **`NewChatPage.tsx`** (`/chat`): "○○님, 무엇을 도와드릴까요?" + `ChatInput`. 첫 전송 시 ChatInput이 세션을 생성.
- **`SearchPage.tsx`** (lazy): 입력 300ms 디바운스 → `searchSessions`, 선택 시 `/chat/:id`.
- **🔄 `RagPage.tsx`** (lazy): **전면 개편** → 아래 11.1.
- **`AdminPage.tsx`** (lazy): 유저 관리(탭: 전체/대기/승인/거절, 승인·거절·삭제, 상세 모달).
- **`ErrorPage.tsx`**: 라우트 에러/404 폴백.

### 🔄 11.1 `RagPage.tsx` — 문서 페이지 (7월 전면 개편)

**6월**: 카드 그리드 + 이름 필터 + 중앙 모달
**7월**: **리스트 행 + 도메인 탭 + 우측 슬라이드 드로어**

```
┌────────────────────────────────────────────────┐
│ 문서  20건                    [🔍 문서 검색...] │  ← 헤더(좌: 제목·건수 / 우: 검색)
├────────────────────────────────────────────────┤
│ 전체  인사·복지  훈령  교범  일반  정보화·보안  │  ← 도메인 탭 (데이터에서 파생!)
├────────────────────────────────────────────────┤
│▌📄 군인사법 시행규칙.pdf [시행규칙]  42p·1.2MB →│  ← RagListItem
│▌📄 진급심사 운영지침.pdf [지침]     18p·640KB →│
└────────────────────────────────────────────────┘
                        클릭 → 우측에서 RagDetail 드로어 슬라이드 인
```

| 구성요소 | 파일 | 설명 |
| --- | --- | --- |
| 페이지 | `RagPage.tsx` | 탭 파생 + 검색 필터 + 드로어 상태 |
| 리스트 행 | 🆕 `rag/RagListItem.tsx` | 좌측 도메인 색 막대 + 아이콘 + 제목/뱃지/설명 + 우측 메타 |
| 상세 드로어 | 🆕 `rag/RagDetail.tsx` | 도메인 뱃지 + 통계 카드 + 요약 + "문서 열기" |
| 검색 입력 | `rag/RagSearchInput.tsx` | 🔄 `compact` prop 추가(헤더 우측용 작은 버전) |

**드로어 애니메이션 패턴** (알아둘 만함):
```tsx
const openDoc = (doc) => {
  setSelectedDoc(doc)                                  // ① 먼저 마운트
  requestAnimationFrame(() => setDrawerOpen(true))     // ② 다음 프레임에 open → transform 전환이 걸림
}
const closeDoc = () => {
  setDrawerOpen(false)                                 // ① 슬라이드 아웃
  setTimeout(() => setSelectedDoc(null), DRAWER_MS)    // ② 애니메이션 끝난 뒤 언마운트
}
```
마운트 직후 바로 `translate-x-0`을 주면 전환 없이 툭 나타난다. **한 프레임 뒤에** 상태를 바꿔야 CSS transition이 작동한다.

+ 드로어 열림 동안 **ESC 닫기** + `body.modal-open`으로 **배경 스크롤 잠금**.

### 🆕 11.2 `mocks/ragDocuments.ts` — 도메인 하드코딩 제거

**문제**: 도메인(카테고리)이 몇 개인지, 이름이 뭔지 **프론트가 미리 알 수 없다**. 백엔드가 정하고 언제든 추가/변경된다.

**해결 3가지:**

1. **타입을 열어둠**: `RagCategory = string` (유니온 하드코딩 X)
2. **탭을 데이터에서 파생**:
   ```ts
   extractDomains(docs)  // 문서들의 도메인을 중복 제거해 {code, label}[] 로 반환
   // 탭 = [{code:'__ALL__', label:'전체'}, ...extractDomains(docs)]
   ```
3. **색상도 값에서 파생**(해시):
   ```ts
   getCategoryStyle(category)  // 도메인 문자열을 해시 → 8색 팔레트에서 결정적으로 배정
   ```
   → 같은 도메인은 **언제나 같은 색**. 도메인이 몇 개든, 새로 추가돼도 **코드 수정 불필요**.

**도메인 값 구조** (백엔드 스펙):

| 코드 | 한글 라벨 |
| --- | --- |
| `HR` | 인사·복지 |
| `TECH` | 정보화·보안 |
| `FINANCE_LEGAL` | 재무·법무 |
| `GENERAL` | 일반 |
| `MANUAL` | 교범 |
| `DIRECTIVE` | 훈령 |

**필터는 코드로, 화면 표시는 라벨로.** (`RagDoc.category` = 코드, `RagDoc.categoryLabel` = 한글 라벨)

> ⚠️ **아직 목업이다.** 실제 문서 API(`GET /api/v1/documents`)는 `{ name, type?, applied_at? }`만 주고 **도메인 필드가 없다.** 백엔드가 추가하면 이 파일을 fetch로 바꾸고 매핑만 맞추면 된다. → 17장.

---

## 12. 레이아웃 `ui/layouts/` (가드 + 셸)

- **`AuthLayout`**: 이미 로그인이면 `/chat`으로 리다이렉트.
- **🔄 `ProtectedLayout`**: 미로그인이면 `/`로. `useGetMe`(401이면 logout) + `useInfiniteSessions`로 **사이드바 구성**.
  - **🆕 서버 응답 → 화면 모델 매핑 지점**:
    ```ts
    const chats = pages.flatMap(p => p.data.data.items)
      .map(s => ({ id: s.session_id, title: s.title, isFavorite: s.is_favorite ?? false }))
    ```
    백엔드 즐겨찾기 필드명이 확정되면 **여기 한 줄만** 고치면 된다.
- **`AdminLayout`**: `useGetUsers`로 접근 확인, 401/403이면 "접근 권한 없음" 화면.

---

## 13. UI 컴포넌트 `ui/components/`

### 13.1 공통
- **`MarsPlanet.tsx`**: 순수 CSS 그라데이션 화성. 로그인 히어로·AI 아바타에서 재사용.
- **`Toast.tsx`**: 5초 후 자동 페이드 아웃, `error`/`success`.
- **`Skeleton.tsx`**: 화면별 로딩 스켈레톤 프리셋 모음.
- **`ErrorBoundary.tsx`**: 렌더 에러 캐치 → 폴백(앱 전체 크래시 방지).

### 13.2 채팅 입력 `chat/ChatInput.tsx`
- 자동 높이 textarea, **초안(draft)을 세션별 Map(`inputDrafts`)에 보관** — 세션 오갈 때 입력 내용 유지.
- **새 채팅 첫 전송**: `createSession` → `saveInflight` → `navigate('/chat/:id', { state:{ initialMessage } })`.
- Enter 전송 / Shift+Enter 줄바꿈.

### 13.3 🔄 메시지 `messages/`

**7월 핵심 변경: `MessageRow` 분리 + `React.memo` (성능)**

- **`MessageList.tsx`**: 메시지 목록 + **스크롤 앵커링**.
  - 새 질문 시 그 질문을 **화면 상단에 고정**하고, 아래에 "딱 한 화면"만큼 **spacer**로 공간 확보(답변이 아래에서 생성).
  - spacer 높이는 React state 대신 **DOM에 직접 반영**(타이밍 버그 방지).
  - ⚠️ **좌표계 통일**: `offsetTop`(offsetParent 기준)이 아니라 **`getBoundingClientRect`**(뷰포트 기준)로 계산.
    `offsetParent`가 스크롤 컨테이너가 아니라 값이 어긋나(60 vs 454) spacer가 과소 계산되던 버그가 있었다. → **"기준이 뭐냐"를 통일**하는 게 핵심.
  - 커스텀 스크롤바 thumb(`absolute`), "맨 아래로" 버튼, `[overflow-anchor:none]`(브라우저 자동 스크롤 보정 끄기).

- **🆕 `MessageRow.tsx`**: 메시지 한 행. **`React.memo`로 감쌈.**
  ```
  왜? 스트리밍 중엔 messages 배열이 60ms마다 갱신된다.
      memo가 없으면 100개 메시지가 전부 리렌더 → 버벅임.
  어떻게 통하나? chatStore가 map에서 안 바뀐 항목을 `: m`으로 참조 유지
      → msg의 참조가 안정적 → memo의 얕은 비교가 통과 → 리렌더 스킵.
  ```
  > **`statusText` prop 주의**: 이 행이 스트리밍 중일 때만 값이 채워지고 **그 외엔 항상 `null`** → 다른 행들의 memo가 깨지지 않는다.
  > `onCopy`/`onRegenerate`도 **안정 참조**(useCallback / Zustand action)여야 memo가 실제로 작동한다.

- **`MessageBubble.tsx`**: 말풍선. 사용자=빨강 그라데이션, AI=흰색+`MarsPlanet` 아바타 + **streamdown 마크다운**. 🆕 `statusText`를 받아 스트리밍 중 진행 상태 표시.
- **`MessageActions.tsx`**: hover 시 시간·복사·재생성 버튼.
- **`SourceBadge.tsx`**: "출처 N개 보기" 토글 → RAG 근거 문서 목록.
- **`ChatHeader.tsx`** / **`ImageAttachment.tsx`**.

### 13.4 🔄 사이드바 `sidebar/`

**7월 핵심 변경: `SessionItem` 공용화 + `FavoriteChats` 추가**

```
Sidebar
 ├ SidebarHeader     (로고 + 접기 토글)
 ├ SidebarMenu       (새 채팅 / 대화 검색 / 문서 검색)
 ├ 🆕 FavoriteChats  ─┐
 │    └ SessionItem   │ 둘 다 같은 SessionItem을 쓴다
 ├ RecentChats       ─┘  → 별/수정/삭제 동작이 100% 동일
 │    └ SessionItem
 └ SidebarFooter     (프로필 → 드롭다운 메뉴)
```

- **🆕 `SessionItem.tsx`**: 세션 한 줄(공용). hover 시 **별(즐겨찾기) / 제목 수정 / 삭제** 액션.
  - 🆕 **페이드 그라데이션**: 제목이 길 때 액션 버튼과 겹치는 구간을 **배경색으로 자연스럽게 페이드아웃**(글자가 버튼 밑으로 잘려 겹치는 걸 방지).
- **🆕 `FavoriteChats.tsx`**: '즐겨찾기' 섹션. **즐겨찾기가 없으면 섹션 자체를 렌더하지 않는다.**
- **`RecentChats.tsx`**: 최근 세션 무한 목록(IntersectionObserver 센티넬).

> **⭐ 파생 상태 원칙 (중요)**: 즐겨찾기 목록을 **별도 state로 저장하지 않는다.**
> `Sidebar.tsx`에서 세션 목록 하나를 진실로 두고 **파생**시킨다:
> ```ts
> const favorites = useMemo(() => chats.filter(c => c.isFavorite), [chats])
> const others    = useMemo(() => chats.filter(c => !c.isFavorite), [chats])
> ```
> 두 곳에 저장하면 **삭제/이름변경/토글 때마다 어긋난다**(유령 데이터). 계산 가능한 값은 계산해서 써라.

### 13.5 rag/ · search/
- 🆕 `rag/RagListItem`, 🆕 `rag/RagDetail`, `rag/RagSearchInput`(🔄 `compact` prop). `rag/RagCard`는 구 디자인 잔재.
- `search/SearchInput`(300ms 디바운스), `search/SearchResults`, `search/SearchResultItem`.

---

## 14. 스타일 시스템

- **Tailwind v4** (`@import "tailwindcss"` in `global.css`).
- **디자인 토큰**: `global.css`의 `@theme { --color-brand:#DC143C; ... }` → `text-brand`, `bg-brand-subtle` 등으로 사용.
  - 브랜드색: `brand/brand-hover/brand-dark/brand-light/brand-soft/brand-subtle`
  - 표면/텍스트: `surface*`, `text-primary/secondary/muted/hint`
- **로그인 전용**: `.mars-root/.mars-intro/.mars-hero-planet/.mars-auth-panel/...` (전환 `.7s` 통일).
- **애니메이션 keyframes**: `fade-in`, `page-in`, `cursor-blink`(스트리밍 커서), `chase`(로딩 점), 🆕 `status-shimmer`(진행 상태 텍스트), `marsFloat/marsSpin/marsBob`(로그인).
- `body.modal-open { overflow:hidden }` — 모달/드로어 열릴 때 배경 스크롤 잠금.
- `.scrollbar-hide` — 기본 스크롤바 숨김(채팅은 커스텀 thumb 사용).

### 14.1 ⭐ 채팅 스크롤 컨테이너 = "높이 사슬"

채팅에서 **헤더는 고정, 목록만 스크롤**되게 하려면 높이가 위에서부터 끊김 없이 내려와야 한다:

```
ProtectedLayout   h-screen overflow-hidden      ← 화면 높이 확정 (100vh)
 └ MessageList    flex flex-col h-full          ← 100% 상속
    ├ ChatHeader                                ← 고정 (flex 형제)
    └ div         relative flex-1 min-h-0       ← 남은 높이 + ★min-h-0
       └ div      h-full overflow-y-auto        ← 이 안에서만 스크롤
```

**`min-h-0`이 없으면 스크롤이 안 생긴다.** flex 자식의 기본 `min-height:auto`가 자식을 **내용만큼 부풀려서** 넘치지 않게 만들기 때문. `min-h-0`로 "내용보다 작아져도 된다"고 허락해야 스크롤 영역이 잡힌다.

그리고 `relative`가 동시에 **커스텀 스크롤바 thumb / "맨 아래로" 버튼(`absolute`)의 기준**(포함 블록)이 된다.

---

## 15. 실제 흐름 따라가기 (시나리오)

### 15.1 로그인
1. `LoginPage` 폼 제출 → `useAuth().login()` → 토큰 저장 → `scheduleTokenRefresh`.
2. `AuthLayout`이 accessToken 감지 → `/chat`로 리다이렉트.

### 15.2 새 채팅 → 첫 질문 (🔄 status 포함)
1. `/chat`에서 `ChatInput` 전송 → `createSession` → `/chat/:id`로 이동(`initialMessage`) + `saveInflight`.
2. `ChatPage`가 `chatStore.connect(id)` → `initialMessage`로 `sendMessage`.
3. `sendMessage`: (질문+빈 답) **낙관적 추가** → `executeStream` → `streamMessage`(SSE)
4. **🆕 서버가 `{type:'status'}`를 보내면** → `statusText`에 저장 → 답변 자리에 "관련 문서를 선별하는 중..." 표시.
5. 첫 텍스트 토큰이 오면 `statusText`를 `null`로 지우고, `createWriter`가 토큰을 60ms로 모아 **in-place 갱신**.
6. 완료 시 `status: 'done'`, `['sessions']` 무효화(사이드바 갱신).

### 15.3 🆕 즐겨찾기 토글
1. `SessionItem`의 별 클릭 → `toggleFavorite({ sessionId, next: !isFavorite })`.
2. **`onMutate`**: 진행 중 refetch 취소 → 캐시를 낙관적으로 수정(**별이 즉시 켜짐**) → 스냅샷 백업.
3. 서버 `PATCH /sessions/{id} { is_favorite }` 전송.
4. 성공 → `onSettled`가 `invalidateQueries`로 재동기화. 실패 → **`onError`가 스냅샷으로 롤백**(별이 도로 꺼짐).
5. `Sidebar`가 `chats.filter(c => c.isFavorite)`로 **파생** → 즐겨찾기 섹션에 자동 반영.

### 15.4 세션 이동 중 스트리밍 (Race Condition)
1. A세션에서 답변 스트리밍 중 → B세션으로 이동.
2. `connect(B)`가 `connectAbortController.abort()`로 **A의 메시지 조회 요청 취소**.
3. A의 SSE 토큰이 계속 도착하지만, `get().sessionId !== 'A'` → **화면 대신 `streamRegistry`에만 기록**.
4. 나중에 A로 돌아오면 `connect(A)`가 `streamRegistry`에서 **진행 중이던 스트림을 이어받는다**.

### 15.5 새로고침 중 답 유실 복원
- 스트리밍 중 새로고침 → `connect`가 `sessionStorage` 캐시 + `rokm_inflight`를 확인 → 마지막이 user 질문이고 inflight면 **`retryLastMessage`로 자동 재시도**.

### 15.6 401 만료
- 아무 API에서 401 → axios 응답 인터셉터가 `refreshTokenOnce` 후 **원요청 재시도**. refresh 실패면 토큰 삭제 + `/`.

---

## 16. 자주 만지는 부분 (위치 빠른 참조)

| 하고 싶은 것 | 파일 |
| --- | --- |
| 로그인/랜딩 디자인·애니메이션 | `pages/LoginPage.tsx` + `global.css`(`.mars-*`) |
| 브랜드 색/토큰 변경 | `ui/styles/global.css` `@theme` |
| 채팅 스트리밍/빈응답/재생성 동작 | `api/store/chatStore.ts` |
| SSE 파싱(이벤트 형식) | `api/services/chat.ts` `readSse` |
| 🆕 진행 상태 문구 표시 | `chat.ts`(`onStatus`) → `chatStore`(`statusText`) → `MessageBubble` |
| 토큰 갱신/401 정책 | `api/lib/axios.ts` |
| 말풍선/마크다운 스타일 | `messages/MessageBubble.tsx` |
| 스크롤 앵커링(질문 상단 고정) | `messages/MessageList.tsx` |
| 🆕 메시지 리렌더 성능 | `messages/MessageRow.tsx` (memo) |
| 🆕 사이드바 세션 행(별/수정/삭제) | `sidebar/SessionItem.tsx` |
| 🆕 즐겨찾기 로직 | `hooks/useSession.ts` `useToggleFavorite` |
| 🆕 문서 리스트/도메인 탭 | `pages/RagPage.tsx` + `rag/RagListItem.tsx` |
| 🆕 도메인 색상 팔레트 | `mocks/ragDocuments.ts` `CATEGORY_PALETTE` |
| 라우트 추가 | `App.tsx` |
| API 엔드포인트 추가 | `api/services/*` + `types/*` |
| 에러 메시지 매핑 | `utils/error.ts` + 각 페이지의 `*_ERRORS` 맵 |

---

## 17. 🚧 아직 안 끝난 것 (다음 할 일)

### 17.1 도메인별 문서 검색 — **백엔드 대기 중**

**현재 상태**: 문서 페이지의 도메인 탭은 **목업 데이터**로 동작한다.

**막힌 지점**: 실제 문서 API가 도메인을 안 준다.
```ts
// types/document.ts — 지금 백엔드가 주는 것
DocumentItem { name, type?, applied_at? }   // ← 도메인 필드 없음!
```

**백엔드에 확인/요청할 것:**
1. 문서 응답에 **도메인 필드 추가** (`domain` or `category`)
2. **코드만**(`"HR"`) 줄지, **라벨도 함께**(`{code, label}`) 줄지
3. 채팅 질문에 도메인을 실어 보낼 수 있는지 (`StreamMessageRequest`에 `domain?` 추가)

**프론트 준비 상태**: 도메인 하드코딩은 이미 제거됨. 서버가 필드만 주면 **매핑 한 곳만 고치면 동작**한다.

### 17.2 도메인 검색 UX 설계 (결정 필요)

두 가지 안이 검토됐다:

| | **1안: 세션 스코프** | **2안: 메시지 스코프** |
| --- | --- | --- |
| 도메인이 붙는 곳 | Session(생성 시 확정) | Message(질문마다 선택) |
| 장점 | 세션이 도메인별로 깔끔히 분리 | 한 세션에서 자유롭게 전환 |
| 단점 | 도메인 늘수록 **세션 폭증** | 세션 내 혼재 → 가독성 저하 |
| 치명적 우려 | 세션 목록 지저분 | **기본이 전체검색이라 아예 안 쓸 수 있음** |

**권고안: 2안 + 하이브리드**
1. 도메인은 **메시지**에 붙임(유연성)
2. 선택은 세션에 **sticky**(한 번 고르면 유지 → 1안의 일관성 흡수)
3. **답변마다 도메인 배지** → 2안의 가독성 단점 해소
4. **새 세션 빈 화면에 도메인 카드 크게 제시** → "안 쓸 우려" 해소 (빈 화면은 무조건 보는 화면이라 발견 가능성 최강)
5. 미선택 = 전체 검색(하위 호환)

### 17.3 즐겨찾기 — **백엔드 필드 확정 대기**

프론트는 `is_favorite`로 가정해 구현해뒀다. 백엔드 필드명이 다르면 **아래 3곳만** 고치면 된다:

| 파일 | 고칠 것 |
| --- | --- |
| `types/session.ts` | `SessionData.is_favorite?`, `UpdateSessionRequest.is_favorite?` |
| `hooks/useSession.ts` | `useToggleFavorite`의 `mutationFn` 필드명 |
| `ui/layouts/ProtectedLayout.tsx` | 매핑 한 줄 (`s.is_favorite ?? false`) |

---

### 부록 A: 환경변수

- `VITE_SERVER_API_URL` — 백엔드 베이스 URL(필수)
- `VITE_STREAM_IDLE_MS` — SSE 무응답 타임아웃(기본 1,200,000 = 20분)

### 부록 B: 7월 신규/변경 파일 요약

| 상태 | 경로 | 역할 |
| --- | --- | --- |
| 🆕 | `utils/uuid.ts` | `crypto.randomUUID` 폴백 (비보안 컨텍스트) |
| 🆕 | `utils/clipboard.ts` | `navigator.clipboard` 폴백 |
| 🆕 | `mocks/ragDocuments.ts` | 문서 목업 + 도메인 색상 해시 파생 |
| 🆕 | `ui/components/messages/MessageRow.tsx` | 메시지 한 행 (React.memo 최적화) |
| 🆕 | `ui/components/sidebar/SessionItem.tsx` | 세션 한 줄 공용화(별/수정/삭제) |
| 🆕 | `ui/components/sidebar/FavoriteChats.tsx` | 즐겨찾기 섹션 |
| 🆕 | `ui/components/rag/RagListItem.tsx` | 문서 리스트 행 |
| 🆕 | `ui/components/rag/RagDetail.tsx` | 문서 상세 드로어 |
| 🔄 | `hooks/useSession.ts` | `useToggleFavorite`(낙관적 업데이트) 추가 |
| 🔄 | `api/services/chat.ts` | SSE `status` 이벤트(`onStatus`) 추가 |
| 🔄 | `api/store/chatStore.ts` | `statusText` 상태 추가 |
| 🔄 | `pages/RagPage.tsx` | 리스트+도메인 탭+드로어로 전면 개편 |
| 🔄 | `types/session.ts`, `types/index.ts` | 즐겨찾기 필드 추가 |
| 🔄 | `ui/layouts/ProtectedLayout.tsx` | 세션→ChatItem 매핑에 `isFavorite` 추가 |
| 🔄 | `ui/components/sidebar/Sidebar.tsx` | 즐겨찾기/일반 **파생** 분리 |

---

> 이 문서는 **2026년 7월 코드 기준 스냅샷**입니다. 파일을 크게 리팩터링하면 해당 장을 함께 갱신하세요.
> 6월판(`FRONTEND_GUIDE.md`)은 그대로 두고 비교용으로 보관합니다.
