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
```

의존 방향은 한쪽으로만 흐릅니다: `app → features → shared·lib`.
기능끼리는 서로 가져다 써도 됩니다(예: 채팅이 분야(`domains`)의 아이콘을 씀).

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
| `chat` | 채팅 화면, 메시지 스트리밍(`store.ts`), 입력창·말풍선·출처 | `/chat`, `/chat/:id` |
| `sessions` | 대화 목록 API, 대화 검색 화면 | `/search` |
| `documents` | 문서 검색(자료실) 화면, 문서 서랍 | `/rag` |
| `domains` | 분야 목록·라벨·색·아이콘 | — |
| `projects` | 프로젝트 화면 | `/projects/:id` |
| `docgen` | 문서 제작 | `/docgen` |
| `translate` | 번역 | `/translate` |
| `system` | 서버 상태, 숨은 진단 화면 | — |
| `landing`·`team`·`tutorials` | 소개·이용 안내·팀·튜토리얼 페이지 | `/guide`, `/team`, `/tutorials` |

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

## 새 기능을 넣을 때

1. `features/<기능>/`을 만들고 `types.ts` → `api.ts` → `hooks.ts` → `components/`·`pages/` 순서로 채운다.
2. `app/App.tsx`에 라우트, 필요하면 `app/sidebar/SidebarMenu.tsx`에 메뉴를 단다.
3. `src/mock/handlers/<기능>.ts`에 가짜 응답을 만들고 `src/mock/index.ts`에 등록한다.

## 아직 규칙과 다른 곳 (정리 예정)

- `features/chat/store.ts`: 스트리밍 상태와 함께 지난 메시지 불러오기(서버 데이터)도 들고 있다.
- 코드 스타일(세미콜론·따옴표)이 파일마다 다르다. Prettier는 거의 모든 파일을 바꾸므로 열린 브랜치를 병합한 뒤 한 번에 적용한다.
- 하드코딩 색(`#fdedf2` 등)과 디자인 토큰(`bg-brand` 등)이 섞여 있다. 새 코드는 토큰을 쓴다.
