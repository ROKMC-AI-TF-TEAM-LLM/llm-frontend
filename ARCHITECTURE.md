# 구조와 규칙

코드는 **기능별**로 모읍니다. 한 기능을 이해하려면 `src/features/<기능>/` 한 폴더만 보면 됩니다.
✅ 표시는 ESLint가 검사합니다(`npm run lint`).

## 큰 틀

```
src/
  main.tsx          앱 시작 (React Query 공급자, mock 모드면 가짜 서버 설치)
  app/              앱 뼈대: 라우트(App.tsx), 레이아웃, 사이드바, 오류 화면
  lib/              기반: axios(토큰 갱신 포함), queryClient, 저장소 키
  shared/           어느 기능에도 기대지 않는 공용 코드: 토스트, 스켈레톤, 범용 훅·유틸, 전역 CSS
  features/<기능>/  기능 하나의 모든 것 (아래)
  mock/             `npm run dev:mock`용 가짜 백엔드. API마다 handlers/<도메인>.ts
mock-server/        dev:mock 개발 서버(Node)에서만 도는 코드. claudeProxy.ts: `.env.mock.local`에 ANTHROPIC_API_KEY가 있으면 mock 채팅을 실제 Claude로 응답
```

의존 방향은 한쪽으로만 흐릅니다: `app → features → shared·lib`.
기능끼리는 가져다 써도 되지만(예: 채팅이 분야(`domains`)의 아이콘을 씀) **서로** 가져다 쓰지는 않습니다.
✅ 방향은 `eslint.config.js`의 `FEATURE_DIRECTION`에 적습니다(sessions→chat, auth→users, landing→auth, domains→documents 금지).

## 기능 폴더 하나의 모양

```
features/<기능>/
  api.ts         서버 엔드포인트 하나당 함수 하나. 요청만 보낸다
  hooks.ts       React Query 훅(조회·변경·캐시 무효화)과 그 기능의 화면 훅
  types.ts       서버 요청·응답 타입과 화면에서 쓰는 모양
  utils.ts       순수 함수 (포맷, 상태 해석, 응답 정리)
  store.ts       zustand 상태 — 서버 데이터가 아닌 것만 (필요할 때만)
  components/    그 기능의 화면 조각
  pages/         라우트 화면. App.tsx가 여기서 가져간다
```

없는 파일은 만들지 않습니다. 파일이 너무 커지면 같은 이름의 폴더로 나눕니다(`hooks.ts` → `hooks/`).

## 기능 목록

| 폴더 | 내용 | 주소 |
| --- | --- | --- |
| `auth` | 로그인·회원가입 화면, 로그인 상태(`AuthProvider`·`useAuth`), 로그인 후 이동 | `/` |
| `users` | 내 정보, 사용자 목록·승인 | — |
| `admin` | 관리자 화면(사용자·자료실 관리) | `/admin` |
| `chat` | 채팅 화면, 메시지 스트리밍(`store/`: 상태·동작 `index.ts`, 스트림 실행 `stream.ts`), 대화 캐시(`storage.ts`), 입력창·말풍선·출처 | `/chat`, `/chat/:id` |
| `sessions` | 대화 목록 API, 대화 검색 화면 | `/search` |
| `documents` | 문서 검색(자료실) 화면, 문서 서랍 | `/rag` |
| `domains` | 분야 목록·라벨·색·아이콘 | — |
| `projects` | 프로젝트 화면 | `/projects/:id` |
| `docgen` | 문서 제작 | `/docgen` |
| `translate` | 번역 | `/translate` |
| `system` | 서버 상태, 숨은 진단 화면 | — |
| `landing`·`team`·`tutorials` | 소개·이용 안내·팀·튜토리얼 페이지 | `/guide`, `/team`, `/tutorials` |

## 공용 코드 (shared)

새 공용 코드를 만들면 여기에 한 줄 추가합니다.

- `shared/utils/date.ts` — 날짜·시간 표시(`formatDate`·`formatDateTime`·`formatDateTimeLong`·`formatClock`). `toLocale*` 호출은 여기에만 둔다
- `shared/utils/fileSize.ts` — 파일 크기 표시(`formatFileSize`)
- `shared/utils/error.ts` — 서버 오류 해석(`getApiError`·`readApiError`·`isNetworkError`, `ApiError` 타입). `response.data.error`를 직접 꺼내지 않는다
- `shared/hooks/useInfiniteScroll.ts` — 목록 끝 감시 요소가 보이면 다음 쪽 불러오기. `IntersectionObserver`를 화면에서 직접 쓰지 않는다(등장 애니메이션 제외)
- `shared/hooks/useEscapeKey.ts`·`useClickOutside.ts` — ESC·바깥 클릭으로 닫기
- `shared/components/icons` — UI 아이콘(닫기·삭제·편집·별·검색·화살표 등)과 공통 틀 `Icon`. 화면에 `<svg>`를 직접 쓰지 않는다(일러스트·로고·차트 제외). 한 기능에서만 쓰는 아이콘은 그 기능의 `components/icons.tsx`
- `shared/components/Button.tsx` — 글자 버튼. 종류(`primary`·`secondary`·`outline`·`danger`·`ghost`·`link`)와 크기(`sm`·`md`·`lg`)만 고른다. `IconButton.tsx` — 아이콘만 있는 버튼(`label` 필수, 크기 `xs`~`lg`, 색조 `default`·`brand`·`danger`·`success`·`solid`). 화면에서 `<button>`에 색·크기 클래스를 직접 쓰지 않는다
- `shared/components/Chip.tsx`(고르는 알약 버튼)·`Tab.tsx`(밑줄 탭)·`MenuItem.tsx`(펼침 메뉴의 한 줄)·`SelectButton.tsx`(눌러서 메뉴를 펼치는 고르기 버튼)
- 글자 크기는 `text-10`~`text-16` 단계만 쓴다(0.5px 단위·임의 px 금지)
- `shared/components/Modal.tsx`·`Drawer.tsx` — 가운데 대화상자와 오른쪽 서랍. 배경, ESC·바깥 클릭 닫기, 포커스 가두기(`useFocusTrap`), 스크롤 잠금(`useBodyScrollLock`)을 맡는다. 화면에서 `fixed inset-0`을 직접 쓰지 않는다
- `shared/store/confirmStore.ts` — `await confirm({ title, message, danger })`. 확인 창은 앱 루트의 `shared/components/ConfirmHost.tsx`가 그린다. 브라우저 기본 확인·알림 창은 쓰지 않는다(오류 알림은 `showToast`)
- `shared/utils/postLoginRedirect.ts` — 로그인 후 돌아갈 주소 기억. `shared/utils/chatStorage.ts` — 대화 캐시 키와 지우기(`clearChatCache`·`clearStoredChatData`)
- `shared/styles/global.css` — 토큰(`@theme`: 색, 글자 크기 `text-10`~`text-16`), 리셋, 여러 화면이 쓰는 규칙, 키프레임만 둔다. 소개성 화면의 스타일은 `shared/styles/intro.css`, 한 기능만 쓰는 스타일은 그 기능의 `styles.css`(사이드바는 `app/sidebar/sidebar.css`)
- `shared/constants.ts` — 여러 기능이 같이 쓰는 문구(`AI_NOTICE`)

## import 쓰는 법

- 같은 기능(또는 같은 `app`·`shared`·`lib`) 안: 상대 경로 `./api`, `../hooks`
- 영역을 넘을 때: `@/features/chat/types`, `@/shared/utils/logError` (`@` = `src`)

## 규칙

1. ✅ **화면 코드(`app`, `shared`, 기능의 `components`·`pages`)는 `api`를 직접 import하지 않는다.**
   서버는 기능의 `hooks.ts`로만 쓴다. `api.ts`에 있던 순수 함수가 필요하면 `utils.ts`로 옮긴다.
2. ✅ **`shared`와 `lib`는 `features`·`app`을 import하지 않는다.** 기능 코드가 필요하다면 그건 공용이 아니다.
3. ✅ **mock 코드는 `src/mock` 안과 `main.tsx`에서만 쓴다.** 서비스에 `USE_MOCK` 같은 분기를 두지 않는다.
4. ✅ **라우터는 `react-router-dom`에서 가져온다.**
5. 서버 데이터는 React Query 캐시 한 곳에만 둔다. zustand에 복사해 두지 않는다.
6. 한 기능에서만 쓰면 그 기능 폴더에, 여러 기능이 쓰는 범용 코드는 `shared`에 둔다.

## 코드 스타일

Prettier가 맡습니다(세미콜론 없음, 작은따옴표, 나머지 기본값 — `.prettierrc.json`). 저장 전에 `npm run format`, 확인은 `npm run format:check`.
전체 포맷 커밋은 `.git-blame-ignore-revs`에 적어 두었습니다(`git config blame.ignoreRevsFile .git-blame-ignore-revs`).

## 새 기능을 넣을 때

1. `features/<기능>/`을 만들고 `types.ts` → `api.ts` → `hooks.ts` → `components/`·`pages/` 순서로 채운다.
2. `app/App.tsx`에 라우트, 필요하면 `app/sidebar/SidebarMenu.tsx`에 메뉴를 단다.
3. `src/mock/handlers/<기능>.ts`에 가짜 응답을 만들고 `src/mock/index.ts`에 등록한다.

## 아직 규칙과 다른 곳 (정리 예정)

- `landing` ↔ `tutorials`가 서로 가져다 쓴다(바닥글이 튜토리얼 목록을 쓰고, 튜토리얼 화면이 소개 화면의 상단·바닥글을 쓴다).
- `features/chat/store/`: 스트리밍 상태와 함께 지난 메시지 불러오기(서버 데이터)도 들고 있다.
- 하드코딩 색과 디자인 토큰(`bg-brand` 등)이 섞여 있다. 3회 이상 쓰이던 색은 `global.css`의 `@theme`에 토큰(`brand-tint`·`rose-border` 등)으로 올렸다. 새 코드는 토큰을 쓴다. 한두 번 쓰인 색과 소개성 화면의 색은 아직 hex로 남아 있다.
