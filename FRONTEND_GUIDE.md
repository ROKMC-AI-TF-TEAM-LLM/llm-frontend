# MARS 프론트엔드 코드 가이드 (전체 구조 상세 이해용)

> 이 문서는 MARS(해병대 RAG 챗봇) 프론트엔드 코드를 **처음부터 끝까지 읽어가며 이해**하도록 만든 가이드입니다.
> 위에서 아래로 순서대로 읽으면 "어디에 무엇이 있고, 데이터가 어떻게 흐르는지"가 잡히도록 구성했습니다.
> 파일 경로는 모두 `src/` 기준입니다.

---

## 0. 읽는 순서 (추천)

1. **1~2장**: 무슨 앱인지 + 폴더 지도
2. **3장**: 앱이 어떻게 켜지고 라우팅되는지 (진입점)
3. **4~6장**: 핵심 3대 축 — ①인증 ②서버통신 ③채팅 스트리밍
4. **7장**: 상태관리 3종(Context/Zustand/React Query)이 각각 뭘 맡는지
5. **8~10장**: 훅/타입/유틸 (재사용 부품)
6. **11~14장**: 화면(페이지/레이아웃/컴포넌트/스타일)
7. **15장**: "실제 기능이 도는 흐름"을 시나리오로 따라가기
8. **16장**: 자주 고치는 부분 위치

---

## 1. 프로젝트 개요 & 기술 스택

**MARS** = "Marine Artificial Intelligence Retrieval System". 해병대 법령·규정·규칙을 학습한 **RAG 챗봇**의 웹 프론트엔드.
백엔드(LLM/RAG 서버)는 별도이고, 프론트는 `VITE_SERVER_API_URL` 환경변수로 연결합니다.

| 영역 | 기술 | 용도 |
|---|---|---|
| 빌드/런타임 | **Vite 8** + React **19** + TypeScript | SPA |
| 라우팅 | **react-router v7** | 페이지 전환, 코드 스플리팅 |
| 서버 상태 | **@tanstack/react-query v5** | 세션/유저/문서 목록 캐시·페이지네이션 |
| 클라이언트 상태 | **Zustand v5** | 채팅 스트리밍 상태(메시지/스트리밍/에러) |
| REST 통신 | **Axios** | 일반 API + JWT 자동 갱신 |
| 스트리밍 | **fetch + SSE** | 채팅 토큰 단위 스트리밍(Axios 아님) |
| 폼 | **react-hook-form + zod** | 로그인/회원가입 검증 |
| 마크다운 | **streamdown** | AI 답변 스트리밍 렌더 |
| 스타일 | **Tailwind CSS v4** (+ `global.css` 디자인 토큰) | 전 UI |

**패키지 매니저**: pnpm (`pnpm-lock.yaml`). 스크립트: `dev`(vite), `build`(`tsc -b && vite build`), `lint`(eslint).

---

## 2. 디렉토리 구조 (한 줄 지도)

```
src/
├─ main.tsx                # 앱 부팅(ReactDOM 렌더 + Provider 장착)
├─ App.tsx                 # 라우터 정의(공개/보호/관리자 라우트)
├─ index.css / App.css     # (미사용 잔재 — 실제 스타일은 ui/styles/global.css)
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
│  ├─ useSession.ts useUser.ts useDocument.ts useServerStatus.ts
│  └─ useLocalStorage.ts useDocumentTitle.ts
│
├─ types/                  # 도메인 모델 + API DTO 타입
│  └─ index.ts chat.ts auth.ts session.ts user.ts document.ts inquiry.ts api.ts
│
├─ utils/                  # error.ts(에러→메시지) logError.ts chunkReload.ts
│
├─ pages/                  # 라우트 화면
│  └─ LoginPage ChatPage NewChatPage SearchPage RagPage AdminPage ErrorPage
│
└─ ui/
   ├─ layouts/             # AuthLayout / ProtectedLayout / AdminLayout (라우트 가드+셸)
   ├─ styles/global.css    # 디자인 토큰(@theme) + 로그인화면(.mars-*) 스타일
   └─ components/          # 재사용 UI
      ├─ MarsPlanet Toast Skeleton ErrorBoundary  (공통)
      ├─ chat/ChatInput
      ├─ messages/  MessageList MessageBubble MessageActions ChatHeader SourceBadge ImageAttachment
      ├─ sidebar/   Sidebar SidebarHeader SidebarMenu RecentChats SidebarFooter
      ├─ rag/       RagCard RagSearchInput
      └─ search/    SearchInput SearchResults SearchResultItem
```

> 참고: `ui/components/LoginCard.tsx`, `SignupCard.tsx`, `BackgroundWave.tsx` 는 **어디서도 import되지 않는 미사용 레거시**. `src/index.css`·`src/App.css` 도 Vite 기본 잔재(실사용 X).

---

## 3. 앱 부팅 & 라우팅

### 3.1 진입점 — `main.tsx`
```
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
`<AuthProvider>`로 전체를 감싼 뒤 `createBrowserRouter`로 라우트 트리를 만든다.

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

## 4. 인증(Auth) 아키텍처 — 가장 먼저 이해할 축

토큰은 두 군데에 나눠 저장한다:
- **access token → `sessionStorage`** (탭 닫으면 사라짐, 수명 짧음)
- **refresh token → `localStorage`** (오래 유지)
- 키는 `constants/key.ts`의 `LOCAL_STORAGE_KEY.{ACCESS_TOKEN, REFRESH_TOKEN}`.

### 4.1 `context/AuthContext.tsx`
- `useAuth()` 훅으로 `{ accessToken, refreshToken, login, logout }` 제공.
- `login(data)` → `authService.login` 호출 → 응답의 `access_token/refresh_token`을 스토리지+state에 저장 → `scheduleTokenRefresh()`.
- `logout()` → 서버 logout 호출 → 토큰 삭제 → `window.location.href='/'`.
- `accessToken`이 있으면 `useEffect`로 갱신 예약.

### 4.2 `api/lib/axios.ts` (JWT 자동화의 심장)
`backendApi` = Axios 인스턴스(`baseURL = VITE_SERVER_API_URL`). 핵심 함수/동작:

- **`decodeTokenExp` / `isTokenExpired`**: JWT payload의 `exp`를 디코드해 만료(5초 여유) 판단.
- **`refreshTokenOnce()`**: refresh 토큰으로 `/auth/refresh` 호출. `pendingRefresh` 프로미스로 **동시 다발 갱신을 1건으로 합침(중복 방지)**. 성공 시 새 토큰 저장 + 다음 갱신 예약.
- **`scheduleTokenRefresh()`**: 만료 **60초 전** 자동 refresh 타이머 예약(선제 갱신).
- **`getValidAccessToken()`**: SSE(fetch)에서 쓰려고 만든 헬퍼 — 만료면 refresh 후 유효 토큰 반환.
- **요청 인터셉터**: 요청 직전 토큰이 만료 임박이면 refresh, `Authorization: Bearer` 부착. 단 `AUTH_ENDPOINTS`(login/signup/refresh)는 제외.
- **응답 인터셉터**: `401` + 아직 재시도 안 함 + auth 엔드포인트 아님 → `refreshTokenOnce()` 후 **원요청 1회 재시도**. refresh까지 실패하면 토큰 삭제 + `/`로 이동.

> 정리: "토큰 붙이기/갱신/401 복구"는 전부 여기서 자동 처리. 각 service 파일은 순수하게 URL만 호출하면 됨.

---

## 5. 서버 통신 계층 `api/`

### 5.1 `queryClient.ts`
React Query 전역 설정. 기본 `staleTime 60s`, `retry 1`. 모든 쿼리/뮤테이션 에러를 `logError`로 콘솔 집계(QueryCache/MutationCache onError).

### 5.2 `api/services/*` — 엔드포인트 래퍼(얇은 층)
각 파일은 `backendApi.get/post/...`를 감싼 함수 모음. 타입은 `types/*`에서 가져옴.

| 파일 | 주요 함수 | 비고 |
|---|---|---|
| `auth.ts` | `login/signup/logout/refresh` | `/api/v1/auth/*` |
| `session.ts` | `getSessions(cursor)/createSession/searchSessions/updateSession/deleteSession` | 커서 페이지네이션 |
| `document.ts` | `getDocuments`, `pickDocuments` | 응답 형태 불안정 대비 정규화 + 30s 타임아웃 |
| `user.ts` | `getMeUsers`, 관리자 `getUsers/approveUser/rejectUser/deleteUsers/inquiryUsers` | |
| `inquiry.ts` | 문의 CRUD + 관리자 답변 | multipart 문의 등록 포함 |
| `health.ts` | `getHealth` → `{ db, llm_server }` | 서버 상태 점 |
| **`chat.ts`** | `getMessages/deleteMessage` + **`streamMessage`/`regenerateMessageStream`** | 아래 5.3 |

### 5.3 `api/services/chat.ts` — SSE 스트리밍 (Axios 아님)
채팅 응답은 **토큰 단위 스트리밍**이라 Axios 대신 `fetch`를 쓴다.
- **`postSse(url, body, signal)`**: `getValidAccessToken()`으로 토큰 붙여 POST. `401`이면 `refreshTokenOnce()` 후 1회 재시도, 그래도 실패면 토큰 삭제 + `/` 이동.
- **`readSse(response, handlers)`**: 응답 body를 reader로 읽으며 `data:` 라인을 파싱.
  - 텍스트 토큰 → `onChunk(text)`
  - `{type:'sources'}` → `onSources(items)`
  - `{type:'error'}` → throw
  - `{type:'text'|'token'|'chunk'|'answer'}` / type 없음 → content 추출해 onChunk
  - **idle 타임아웃**(`VITE_STREAM_IDLE_MS`, 기본 20분) 동안 무응답이면 중단.
- `streamMessage`(일반 전송)와 `regenerateMessageStream`(재생성)이 **같은 SSE 형식**을 공유.

---

## 6. 채팅 스트리밍 엔진 — `api/store/chatStore.ts` (핵심·최대 파일)

Zustand 스토어. **채팅 화면의 모든 상태와 스트리밍 로직의 중심**. 여기만 이해하면 채팅 동작 90%는 이해된 것.

### 6.1 상태
`sessionId, messages[], isStreaming, error, isDeleted, abortController`

### 6.2 내부 메커니즘
- **`createWriter(sessionId, assistantId)`**: SSE로 들어오는 토큰을 **~60ms throttle**로 모아 in-place 갱신(재렌더 폭발 방지). 사용자가 텍스트를 **드래그 선택 중이면 업데이트를 잠시 보류**(복사 가능하게). `push/flushNow/setSources` 제공.
- **`executeStream(...)`**: `streamMessage` 호출 → 성공/실패/빈응답 분기. 
  - **빈 응답**(내용 0) = 백엔드 LLM 생성 실패로 간주 → 에러 표시 + 질문·빈답 정리.
  - 실패 시 낙관적으로 추가했던 (질문,답) 쌍 롤백, 첫 메시지 실패면 빈 세션까지 삭제.
- **`executeRegenerate(...)`**: 재생성 SSE. 실패/빈응답이면 해당 답변을 `interrupted` 상태로.
- **`cleanupEmptyExchange(...)`**: 백엔드에 남은 "질문+빈답" 쌍을 조회해 삭제(새로고침 시 되살아나지 않도록). 빈 세션이면 세션까지 삭제.
- **`extractContent(raw)`**: 서버가 준 값이 중첩 JSON(`{content:{answer:...}}`)일 수 있어 재귀적으로 실제 텍스트만 뽑아냄.

### 6.3 캐시·복원 (새로고침/재접속 견고성)
- `streamRegistry`(메모리): **다른 세션으로 이동해도 백그라운드 스트림을 이어받기** 위해 진행 중 메시지 저장.
- `messageCache`(메모리) + `sessionStorage`(`rokm_cache_*`): 세션별 메시지 캐시 → 재방문 시 즉시 표시.
- `INFLIGHT`(`localStorage rokm_inflight`): "전송했는데 아직 답 못 받은 질문" 기록 → 새로고침/재접속 시 자동 재시도(`retryLastMessage`).

### 6.4 액션(컴포넌트가 호출)
| 액션 | 설명 |
|---|---|
| `connect(sessionId)` | 세션 진입 시: 스트림 이어받기/캐시/서버 메시지 로드 + 정렬·dedup + inflight 재시도 |
| `disconnect()` | 상태 초기화 |
| `sendMessage(content)` | 낙관적으로 (질문+빈 답) 추가 후 `executeStream` |
| `retryLastMessage()` | 마지막 user 질문으로 재스트리밍 |
| `regenerateMessage(assistantId)` | 그 답변의 원본 질문을 찾아 재생성(서버 답변 못 찾으면 재전송 폴백) |
| `abortStream()` | 진행 중 스트림 중단 |

> **재생성/편집 규칙**: 원본 Q&A를 in-place로 고치지 않고, 맨 아래 어시스턴트 메시지에 대해서만 재생성 버튼 노출(`MessageList`에서 `lastAssistantId` 계산).

---

## 7. 상태관리 3종 — 역할 분담

| 도구 | 담당 | 위치 |
|---|---|---|
| **React Context** | 인증(토큰, login/logout) | `context/AuthContext` |
| **React Query** | 서버 목록 데이터(세션/유저/문서/헬스) 캐시·무한스크롤 | `hooks/*` |
| **Zustand** | 채팅 실시간 스트리밍 상태 | `api/store/chatStore` |

핵심: "채팅 스트리밍"은 초 단위로 바뀌고 낙관적 업데이트가 많아 Query 대신 Zustand, "목록류"는 캐시/무효화가 중요해 Query, "인증"은 앱 전역이라 Context.

---

## 8. 훅 `hooks/`

- **`useSession.ts`**: `useInfiniteSessions`(커서 무한스크롤), `useCreateSession`, `useSearchSessions`, `useUpdateSession`, `useDeleteSession`. 뮤테이션 성공 시 `['sessions']` 캐시 무효화.
- **`useUser.ts`**: `useGetMe`(내 정보), 관리자용 `useInfiniteUsers/useGetUsers/useApproveUser/useRejectUser/useDeleteUsers/useInquiryUsers`.
- **`useDocument.ts`**: `useInfiniteDocuments`(문서 무한스크롤, `has_more` + 누적 offset).
- **`useServerStatus.ts`**: 헬스 폴링 → `'checking'|'ok'|'error'`. db+llm_server 둘 다 OK여야 ok, 아니면 20초 간격 재시도.
- **`useLocalStorage.ts`**: local/session 스토리지 get/set/remove 래퍼(JSON, try/catch). AuthContext가 사용.
- **`useDocumentTitle.ts`**: 문서 타이틀 `"제목 - MARS"` 설정, 언마운트 시 복원.

---

## 9. 타입 `types/`

- **`index.ts`** = 프론트 도메인 모델. `Message` 유니온이 핵심:
  - `UserMessage`(role:'user', type:'text')
  - `AssistantMessage`(role:'assistant', type:'text', **status: streaming|done|interrupted**, sources?)
  - `ImageMessage`(type:'image')
  - 그 외 `Source`, `User`, `RagDocument` 등.
- **`chat.ts`**: 서버 DTO. 서버 메시지 `MessageItem`의 role은 `'human'|'ai'` → 프론트 `'user'|'assistant'`로 chatStore가 변환.
- **`auth/session/user/document/inquiry.ts`**: 각 API 요청/응답 DTO. 공통 응답 래퍼는 `api.ts`(`{success, status_code, data, error}`).

---

## 10. 유틸 `utils/`

- **`error.ts`**: `getApiError(error, codeMap, statusMap, fallback)` — 백엔드 `error.code` → HTTP status → fallback 순으로 사용자 메시지 매핑. `isNetworkError`, `DEFAULT_STATUS_ERRORS`.
- **`logError.ts`**: 일관 콘솔 로깅. axios 에러면 `HTTP status / method URL / code / detail`을 한 줄 요약. **끄고 싶으면 이 함수 본문만 비우면 전체 무음.**
- **`chunkReload.ts`**: 코드 스플릿 청크 로드 실패 시 10초 내 1회만 새로고침(무한 루프 방지).

---

## 11. 페이지 `pages/`

- **`LoginPage.tsx`** (랜딩+인증, 가장 UI가 복잡): 스크롤 인트로(MARS 소개: 히어로/특징/사용법/CTA) + "시작하기" 클릭 시 오른쪽 40% 로그인 패널이 슬라이드 인, 왼쪽 60%는 히어로가 그대로 브랜딩이 되고 행성이 왼쪽으로 이동. `view: 'intro'|'auth'`, `mode: 'login'|'signup'`, react-hook-form+zod. 스타일은 `global.css`의 `.mars-*`.
- **`ChatPage.tsx`** (`/chat/:id`): `chatStore.connect(sessionId)`로 세션 연결 → `MessageList` + `ChatInput`. 세션없음/권한/서버오류 분기, 삭제된 세션이면 `/chat`로 이동(toast). 새 채팅에서 넘어온 `initialMessage` 처리.
- **`NewChatPage.tsx`** (`/chat`): "○○님, 무엇을 도와드릴까요?" + `ChatInput`. 첫 전송 시 ChatInput이 세션을 생성.
- **`SearchPage.tsx`** (lazy): 입력 300ms 디바운스 → `searchSessions`, 선택 시 `/chat/:id`.
- **`RagPage.tsx`** (lazy): 문서 무한스크롤 카드 + 이름 필터 + 상세 모달(ESC 닫기).
- **`AdminPage.tsx`** (lazy): 유저 관리(탭: 전체/대기/승인/거절, 승인·거절·삭제, 상세 모달). 상세 모달이 `body.modal-open`(overflow 잠금)을 토글.
- **`ErrorPage.tsx`**: 라우트 에러/404 폴백(이전/홈).

---

## 12. 레이아웃 `ui/layouts/` (가드 + 셸)

- **`AuthLayout`**: 이미 로그인(accessToken)이면 `/chat`으로 리다이렉트, 아니면 로그인 페이지 Outlet.
- **`ProtectedLayout`**: 미로그인이면 `/`로. `useGetMe`(401이면 logout) + `useInfiniteSessions`로 **사이드바 구성**, 접힘 토글, 메인 영역을 `ErrorBoundary`로 감싸고 페이지 전환 fade. 사이드바 폭을 `--sidebar-width` CSS 변수로 반영.
- **`AdminLayout`**: `useGetUsers`로 접근 확인, 401/403이면 "접근 권한 없음" 화면. `ProtectedLayout` 하위에 중첩.

---

## 13. UI 컴포넌트 `ui/components/`

### 13.1 공통
- **`MarsPlanet.tsx`**: 순수 CSS 그라데이션 화성(빨간 행성). `glow`/`className`/`style` props. 로그인 히어로·AI 아바타에서 재사용.
- **`Toast.tsx`**: 5초 후 자동 페이드 아웃, `error`/`success` 타입.
- **`Skeleton.tsx`**: 화면별 로딩 스켈레톤 프리셋 모음(Sidebar/Messages/Search/Rag/Admin 등).
- **`ErrorBoundary.tsx`**: 렌더 에러 캐치 → 폴백(앱 전체 크래시 방지). ProtectedLayout이 페이지 영역을 감쌈.

### 13.2 채팅 입력 `chat/ChatInput.tsx`
- 자동 높이 textarea, **초안(draft)을 세션별 Map(`inputDrafts`)에 보관** — 세션 오갈 때 입력 내용 유지.
- 이미지 첨부(`sendImageMessage`).
- **새 채팅에서 첫 전송**: `createSession`으로 세션 생성 → `saveInflight` → `navigate('/chat/:id', { state:{ initialMessage } })`. 기존 채팅은 `chatStore.sendMessage`.
- Enter 전송 / Shift+Enter 줄바꿈. `toSessionTitle`로 첫 줄 30자 요약을 세션 제목으로.

### 13.3 메시지 `messages/`
- **`MessageList.tsx`**: 메시지 목록 + **스크롤 앵커링**. 새 질문 시 그 질문을 화면 상단에 고정하고 아래에 "딱 한 화면"만큼 **spacer**로 공간 확보(답변이 아래에서 생성). spacer 높이는 React state 대신 DOM에 직접 반영(타이밍 버그 방지). 커스텀 스크롤바 thumb, "맨 아래로" 버튼, 복사 실패 토스트. **재생성 버튼은 맨 아래 어시스턴트에만** 노출.
- **`MessageBubble.tsx`**: 말풍선. 사용자=빨강 그라데이션 라운드, AI=흰색+`MarsPlanet` 아바타 + **streamdown 마크다운**(스트리밍 지원). 한글에 붙은 볼드(`...)**에`) 보정(`fixBold`), 마크다운 정규화(`normalizeMarkdown`).
- **`MessageActions.tsx`**: 말풍선 hover 시 시간(툴팁으로 전체 날짜)·복사·재생성 버튼.
- **`SourceBadge.tsx`**: "출처 N개 보기" 토글 → RAG 근거 문서 목록(이름/페이지).
- **`ChatHeader.tsx`**: 상단 세션 제목. **`ImageAttachment.tsx`**: 이미지 메시지 렌더.

### 13.4 사이드바 `sidebar/`
- **`Sidebar.tsx`**: 헤더+메뉴+최근대화+푸터 조립. 열림(w-64)↔접힘(w-20).
- **`SidebarHeader.tsx`**: 로고 + 접기 토글.
- **`SidebarMenu.tsx`**: 새 채팅 / 대화 검색 / 문서 검색 네비.
- **`RecentChats.tsx`**: 최근 세션 무한 목록(IntersectionObserver 센티넬로 더 불러오기), 제목 클릭 이동, **이름 수정/삭제**(현재 세션 삭제 시 `/chat`로).
- **`SidebarFooter.tsx`**: 프로필 버튼(이름) → **클로드식 드롭다운 메뉴**(이메일 헤더 + 팀 소개·서비스 이용법·관리자 페이지·로그아웃). 바깥 클릭/Esc로 닫힘.

### 13.5 rag/ · search/
- `rag/RagCard`(문서 카드), `rag/RagSearchInput`(이름 필터).
- `search/SearchInput`, `search/SearchResults`, `search/SearchResultItem`(`SearchResult` 타입 export).

---

## 14. 스타일 시스템

- **Tailwind v4** (`@import "tailwindcss"` in `global.css`), 유틸 클래스로 대부분 스타일링.
- **디자인 토큰**: `global.css`의 `@theme { --color-brand:#DC143C; ... }` → Tailwind에서 `text-brand`, `bg-brand-subtle` 등으로 사용.
  - 브랜드색 계열: `brand/brand-hover/brand-dark/brand-light/brand-soft/brand-subtle`
  - 표면/텍스트: `surface*`, `text-primary/secondary/muted/hint`
- **로그인 화면 전용 스타일**: `.mars-root/.mars-intro/.mars-hero-planet/.mars-auth-panel/.mars-wordmark/.mars-orbit` 등 — 로그인 애니메이션 로직이 대부분 여기(전환 `.7s` 통일).
- 공용 애니메이션 keyframes: `fade-in`, `cursor-blink`(스트리밍 커서), `chase`(로딩 점), `marsFloat/marsSpin/marsReveal`(로그인).
- `body.modal-open { overflow:hidden }` — 모달 열릴 때 배경 스크롤 잠금(Rag/Admin 상세 모달).

---

## 15. 실제 흐름 따라가기 (시나리오)

### 15.1 로그인
1. `LoginPage` 폼 제출 → `useAuth().login()` → `authService.login` → 토큰 저장 → `scheduleTokenRefresh`.
2. `AuthLayout`이 accessToken 감지 → `/chat`로 리다이렉트.

### 15.2 새 채팅 → 첫 질문
1. `/chat`(NewChatPage)에서 `ChatInput` 전송 → `createSession` → `/chat/:id`로 이동(`initialMessage` 전달) + `saveInflight`.
2. `ChatPage`가 `chatStore.connect(id)` → 그다음 `initialMessage`로 `sendMessage`.
3. `sendMessage`: (질문+빈 답) 낙관적 추가 → `executeStream` → `streamMessage`(SSE) → `createWriter`가 토큰을 60ms로 모아 답변 in-place 갱신 → 완료 시 `done`, `['sessions']` 무효화(사이드바 갱신).

### 15.3 새로고침 중 답 유실 복원
- 스트리밍 중 새로고침 → `connect`가 `sessionStorage` 캐시 + `localStorage` inflight를 확인 → 마지막이 user 질문이고 inflight면 `retryLastMessage`로 자동 재시도.

### 15.4 401 만료
- 아무 API에서 401 → axios 응답 인터셉터가 `refreshTokenOnce` 후 원요청 재시도. refresh 실패면 토큰 삭제 + `/`.

---

## 16. 자주 만지는 부분 (위치 빠른 참조)

| 하고 싶은 것 | 파일 |
|---|---|
| 로그인/랜딩 화면 디자인·애니메이션 | `pages/LoginPage.tsx` + `ui/styles/global.css`(`.mars-*`) |
| 브랜드 색/토큰 변경 | `ui/styles/global.css` `@theme` |
| 채팅 스트리밍/빈응답/재생성 동작 | `api/store/chatStore.ts` |
| SSE 파싱(이벤트 형식) | `api/services/chat.ts` `readSse` |
| 토큰 갱신/401 정책 | `api/lib/axios.ts` |
| 말풍선/마크다운 스타일 | `ui/components/messages/MessageBubble.tsx` |
| 스크롤 앵커링(질문 상단 고정) | `ui/components/messages/MessageList.tsx` |
| 사이드바 메뉴/프로필 | `ui/components/sidebar/*` |
| 라우트 추가 | `App.tsx` |
| API 엔드포인트 추가 | `api/services/*` + `types/*` |
| 에러 메시지 매핑 | `utils/error.ts` + 각 페이지의 `*_ERRORS` 맵 |

---

### 부록: 환경변수
- `VITE_SERVER_API_URL` — 백엔드 베이스 URL(필수)
- `VITE_STREAM_IDLE_MS` — SSE 무응답 타임아웃(기본 1,200,000 = 20분)

> 이 문서는 코드 기준 스냅샷입니다. 파일을 크게 리팩터링하면 해당 장을 함께 갱신하세요.
> 표 형식 파일 단위 요약은 `frontend-code-guide.csv`도 참고.
