# 기능별 폴더 구조로의 전환 제안

브랜치: `refactor/feature-folders` · 작성: 2026-11-09

이 문서는 프론트엔드 폴더 구조를 **기능별(feature-based)** 로 바꾸자는 제안입니다.
무엇이 문제였는지, 왜 부분 정리로는 부족한지, 무엇이 나아지는지, 병합 전에 무엇을 확인해야 하는지를 다룹니다.
같은 시기에 진행된 `refactor/code-cleanup`, `fix/sidebar-state`, `fix/admin-document-retry`와 어떻게 합칠지도 함께 적었습니다.

---

## 1. 요약

- 기존 구조는 **두 가지 규칙이 반쯤씩 섞여** 있었습니다. 파일 종류별(`api/`, `hooks/`, `types/`, `ui/`, `pages/`)로 나누면서, 일부 기능만 `features/`에 모았습니다. 그래서 어느 규칙으로 읽어도 맞지 않았습니다.
- 그 결과 **기능 하나가 6~8개 폴더에 흩어졌고**, 새 기능을 넣을 때마다 놓이는 방식이 달라졌습니다.
- 이 브랜치는 `src/` 파일 151개 중 131개를 옮겨 **모든 기능을 `features/<기능>/` 한 폴더에 같은 모양으로** 모았습니다. 규칙은 문서([ARCHITECTURE.md](../ARCHITECTURE.md))와 ESLint로 고정했습니다.
- 동작 변화는 lint 정리 일부(5절)를 빼면 없습니다. `tsc`, `vite build`(일반·mock), `npm run lint`가 모두 통과합니다. 다만 **브라우저에서 화면을 직접 확인하지는 않았습니다.** 7절의 확인 목록을 꼭 봐 주세요.
- `refactor/code-cleanup`과 겹치는 파일이 많습니다. 손으로 충돌을 풀지 않도록 **옮기기 스크립트를 함께 커밋했습니다.** 다른 브랜치를 먼저 병합한 뒤 이 이동을 다시 실행하는 순서를 제안합니다(8절).

---

## 2. 기존 구조의 문제점

### 2-1. 기능 하나가 여러 폴더에 흩어져 있다

기존 구조는 "파일 종류"로 폴더를 나눴습니다. 기능 하나를 이해하려면 종류별 폴더를 모두 돌아야 했습니다.

**채팅을 고치려면 8개 폴더를 열어야 했습니다.**

```
src/api/services/chat.ts          메시지 조회·스트리밍 요청
src/api/services/session.ts       대화 목록 요청
src/api/store/chatStore.ts        스트리밍 상태 (833줄)
src/hooks/useSession.ts           대화 목록 훅
src/types/index.ts                Message, Source 같은 화면 타입
src/types/chat.ts                 메시지 API 타입
src/types/session.ts              대화 API 타입
src/utils/sessionTitle.ts         대화 제목 표시
src/ui/components/chat/           입력창, 분야 선택
src/ui/components/messages/       말풍선, 출처, 첨부 파일
src/pages/ChatPage.tsx, NewChatPage.tsx
```

**문서 제작은 6개 폴더였습니다.**

```
src/api/services/docgen.ts, docgenMock.ts
src/hooks/useDocGen.ts
src/types/docgen.ts
src/utils/docgen.ts
src/features/docgen/      ← 화면 조각과 '화면 훅'은 여기
src/pages/docgen/
```

`hooks/`를 열면 채팅·프로젝트·문서·사용자·번역 훅이 한데 섞여 있습니다. **어떤 파일들이 한 기능을 이루는지 폴더만 보고는 알 수 없었습니다.**

### 2-2. 같은 종류의 코드가 기능마다 다른 곳에 있다

같은 "화면 조각"인데 기능마다 위치가 달랐습니다.

| | 채팅 | 프로젝트 | 문서 제작 |
| --- | --- | --- | --- |
| 화면 조각 | `ui/components/chat`, `ui/components/messages` | `features/projects/ui.tsx` | `features/docgen/components.tsx` |
| 상태 | `api/store/chatStore.ts` | `features/projects/projectStore.ts` | (없음) |
| 데이터 훅 | (store가 대신) | `hooks/useProject.ts` | `hooks/useDocGen.ts` + `features/docgen/hooks.ts` |
| 타입 | `types/index.ts` + `types/chat.ts` | `types/project.ts` + `features/projects/mock.ts` | `types/docgen.ts` |
| 목 | `mock/handlers/sessions.ts` | `mock/handlers/projects.ts` | `api/services/docgenMock.ts` |

새 기능을 만드는 사람은 **어느 줄을 따라야 할지 정할 수 없습니다.** 그래서 기능이 추가될 때마다 또 다른 방식이 생깁니다. 문서 제작이 그 예입니다.

### 2-3. `features/`의 뜻이 폴더마다 다르다

- `features/docgen`: 화면 조각과 화면 훅
- `features/projects`: 상태 store, 953줄짜리 UI 파일, 그리고 **이름은 `mock.ts`인데 실제로는 화면이 쓰는 진짜 타입**(`Project`, `ProjectChat`)
- `features/team`, `features/tutorials`: 소개 페이지의 문구와 장식 컴포넌트

"`features`에 무엇을 두는가"에 대한 답이 없으니, 이 폴더는 구조가 아니라 **임시 보관함**처럼 쓰였습니다.

### 2-4. 이름과 위치가 내용을 속인다

- `features/projects/mock.ts`: 지워도 될 가짜 데이터처럼 보이지만, 실제로는 사이드바와 프로젝트 화면이 쓰는 타입 파일이었습니다. 이름을 믿고 지우면 앱이 깨집니다.
- `api/store/`: `chatStore`와 `toastStore`는 API가 아니라 앱 상태입니다. 토스트 알림이 `api` 아래에 있을 이유가 없습니다.
- `api/services/document.ts`의 `pickDocuments`: 서버를 부르지 않는 순수 함수인데 서비스 파일에 있었습니다. 그래서 문서 검색 화면이 "서비스를 직접 import"해야 했습니다.

### 2-5. 목(mock)이 두 갈래다

`src/mock`은 브라우저의 fetch를 가로채기 때문에 서비스 코드가 목인지 모릅니다. 잘 만든 구조입니다.
그런데 문서 제작만 이걸 쓰지 않고 서비스 함수마다 분기를 넣었습니다.

```ts
const USE_MOCK = import.meta.env.VITE_DOCGEN_MOCK !== 'false'
export const getDocGenJobs = () => USE_MOCK ? docgenMock.getJobs() : backendApi.get(...)
```

이 분기 때문에 생긴 문제는 2-6에서 다룹니다.

### 2-6. 기능을 지워도 찌꺼기가 남는다

흩어져 있으면 무엇을 같이 지워야 하는지 알 수 없습니다. 이번에 실제로 발견한 것들입니다.

- 문서 제작 시안 폴더를 지운 뒤에도 시안 전용 함수(`resetDocGenMock`, `useJobSelection`, `useDocGenPage`, `PreviewActions`)가 다른 폴더에 남아 있었습니다.
- 아무도 쓰지 않는 코드가 그대로 있었습니다: `types/api.ts`의 `ApiErrorCode`, `ui/components/landing/Reveal.tsx`, `types/index.ts`의 `RagDocument`.

### 2-7. 규칙이 사람 머릿속에만 있었다

"화면은 서버를 훅으로만 부른다", "목은 `src/mock`에서만" 같은 규칙은 어디에도 적혀 있지 않았고, 검사하는 도구도 없었습니다.
`npm run lint`는 기존 오류 11건 때문에 **항상 실패하는 상태**여서, 새 위반이 생겨도 묻혔습니다.

---

## 3. "타입 체크가 통과하면 괜찮다"는 착각

먼저 사실부터 말하면, **타입 체크 자체는 제대로 동작하고 있었습니다.** TypeScript 6은 `strict`가 기본으로 켜져 있고, 이 코드는 `tsc --strict`에서도 오류가 0건입니다.

문제는 **"`tsc`가 통과했다 = 앱이 맞게 동작한다"로 받아들인 것**입니다. 타입 체크가 잡을 수 없는 종류의 결함이 기존 구조에 실제로 있었습니다.

### 3-1. 배포 빌드가 가짜 서버를 쓰고 있었다

2-5의 분기는 **환경 변수가 없으면 목을 쓰도록** 되어 있었습니다(`!== 'false'`). 그런데 `VITE_DOCGEN_MOCK`은 `.env.mock`에만 있고 `.env`에는 없습니다.

결과적으로 **일반 `npm run build`로 만든 배포본에서도 문서 제작은 브라우저 sessionStorage에 저장하는 가짜 서버로 동작했습니다.** 타입은 진짜 응답과 목 응답이 똑같으니 `tsc`는 아무 말도 하지 않습니다.

### 3-2. 타입은 "있다"고 하는데 실제로는 늘 비어 있었다

프로젝트 store는 서버 응답을 화면 타입 `Project`로 바꿀 때, 서버에 없는 필드를 빈 값으로 채웠습니다.

```ts
description: '', domain: '미지정', updatedAt: '', order: 0,
files: [], chats: [],
```

사이드바의 `RecentChats`는 `p.chats`로 "프로젝트 안의 대화"를 최근 대화 목록에 섞어 보여 주려고 합니다. 하지만 `chats`는 **항상 `[]`** 라서 이 기능은 한 번도 동작한 적이 없습니다. 타입상으로는 `ProjectChat[]`가 분명히 있으므로 `tsc`는 통과합니다.

(`fix/sidebar-state`가 이 store를 쿼리 캐시로 바꿨으므로, 병합 후 이 부분이 어떻게 됐는지 다시 확인해야 합니다. 7절 참고)

### 3-3. 안 쓰는 코드는 타입 체크가 찾지 못한다

`noUnusedLocals`는 파일 **안**에서 안 쓰는 변수만 잡습니다. **export했는데 아무도 import하지 않는 코드나, 아무도 import하지 않는 파일은 잡지 못합니다.** 2-6의 찌꺼기들이 모두 `tsc`를 통과한 채 남아 있던 이유입니다.

### 3-4. 구조 규칙은 타입으로 표현할 수 없다

"화면 컴포넌트가 서버 함수를 직접 import하면 안 된다"는 타입 오류가 아닙니다. `LoginPage`는 회원가입 요청을 서비스에서 바로 불렀고, 이는 타입상 아무 문제가 없었습니다.

### 3-5. 검사기가 아예 건너뛴 화면이 있었다

`LoginPage`는 react-hook-form의 `watch()`를 쓰고 있었습니다. React Compiler 계열 lint는 이 API를 안전하게 분석할 수 없어서 **화면 전체를 건너뛰고** 경고 한 줄만 남겼습니다. `watch()`를 `useWatch()`로 바꾸자 그 아래 숨어 있던 문제(effect 안에서 상태를 바꾸는 코드)가 비로소 드러났습니다.

### 그래서 이 브랜치는

타입 체크가 못 보는 영역을 **ESLint의 import 경계 규칙**으로 메웠습니다(4-3절). 이 규칙은 "모든 기능이 같은 모양"이어야 경로 패턴으로 쓸 수 있습니다. 구조를 먼저 통일해야 했던 이유 중 하나입니다.

---

## 4. 바꾼 구조

### 4-1. 큰 틀

```
src/
  main.tsx
  app/        라우트(App.tsx), 레이아웃, 사이드바, 오류 화면    ← 앱 뼈대
  lib/        axios, queryClient, storageKeys                    ← 기반
  shared/     토스트, 스켈레톤, 범용 훅·유틸, 전역 CSS             ← 기능과 무관한 공용
  features/<기능>/
    api.ts  hooks.ts  types.ts  utils.ts  store.ts  components/  pages/
  mock/       가짜 백엔드 (모든 기능이 여기 하나만 사용)
```

기능: `auth`, `users`, `admin`, `chat`, `sessions`, `documents`, `domains`, `projects`, `docgen`, `translate`, `system`, `landing`, `team`, `tutorials`

### 4-2. 같은 기능, 바뀐 모습

**채팅** (8개 폴더 → 1개)

```
features/chat/
  api.ts        types.ts      store.ts
  components/   ChatInput, MessageList, MessageBubble, SourceBadge …
  pages/        ChatPage, NewChatPage
```

**문서 제작** (6개 폴더 → 1개 + 목)

```
features/docgen/
  api.ts  hooks.ts  types.ts  utils.ts  README.md
  components/   parts.tsx, icons.tsx
  pages/        DocGenPage.tsx
mock/handlers/docgen.ts
```

### 4-3. 규칙을 도구로 고정

| 규칙 | 검사 |
| --- | --- |
| 화면 코드(`app`, `shared`, 기능의 `components`·`pages`)는 `api`를 직접 import하지 않는다 | ESLint ✅ |
| `shared`는 `features`·`app`을 import하지 않는다 | ESLint ✅ |
| mock 코드는 `src/mock`과 `main.tsx`에서만 쓴다 | ESLint ✅ |
| 라우터는 `react-router-dom`에서만 가져온다 | ESLint ✅ |
| 서버 데이터는 React Query 캐시 한 곳에만 둔다 | 문서 (리뷰로 확인) |

일부러 규칙을 어긴 파일을 만들어 실제로 걸리는 것을 확인한 뒤 지웠습니다.

### 4-4. import가 읽힌다

`'@/'` 경로 별칭을 추가했습니다(`@` = `src`). 같은 기능 안에서는 상대 경로를 쓰고, 기능을 넘을 때만 `@/`를 씁니다.

```ts
// 전
import { useChatStore } from '../../../api/store/chatStore'
import { getDomainLabel } from '../../../utils/document'
// 후
import { useChatStore } from '@/features/chat/store'
import { getDomainLabel } from '@/features/domains/utils'
```

경로만 보고도 "어느 기능의 무엇"인지 알 수 있습니다.

---

## 5. 이 브랜치에 들어간 변경 (커밋 순)

| 커밋 | 내용 | 동작 변화 |
| --- | --- | --- |
| `74e3a9e` | 문서 제작 v12 확정, 시안 삭제, 메뉴 추가, 삭제 버튼, 첫 화면 입력창 위치 | 있음 |
| `76c5597` | 문서 제작 목을 `src/mock`으로 통일, `USE_MOCK` 분기 제거 | 있음 (3-1 해결, 7절 참고) |
| `0ac7615` | `api/store` → `store`, `projects/mock.ts` → `types.ts`, 라우터 import 통일 | 없음 |
| `44c96c9` | ARCHITECTURE.md, ESLint import 경계, 회원가입 훅·`pickDocuments` 이동 | 없음 |
| `85bf760` | **기능별 폴더로 전환** (131개 파일 이동, `@/` 별칭) | 없음 |
| `b000658` | lint 문제 11건 정리 → `npm run lint` 통과 | 일부 있음 (7-1) |
| (이 커밋) | 이 문서, 옮기기 스크립트 | 없음 |

`85bf760`에서 내용을 손댄 파일은 다음과 같습니다.
- **합침 3건:** 채팅 화면 타입 + API 타입, 프로젝트 화면 타입 + API 타입, 문서 제작 데이터 훅 + 화면 훅
- **나눔 2건:** `utils/document.ts` → `documents/utils.ts`(문서) + `domains/utils.ts`(분야), `FileAttachment` → `shared/types/attachment.ts`

---

## 6. 왜 부분 정리로는 부족한가 (`refactor/code-cleanup`과 비교)

`refactor/code-cleanup`(11/6)도 같은 문제를 보고 정리를 시작했습니다. 화면 조각을 `features/chat`, `features/search`, `features/rag`로 옮기고, `projects/ui.tsx`를 역할별로 나누고, README에 규칙을 적었습니다. 방향은 같습니다.

다만 **화면 조각만 옮기고 `api/`, `hooks/`, `types/`, `utils/`, `pages/`는 그대로 두었습니다.** 그 결과는 다음과 같습니다.

| | `refactor/code-cleanup` | 이 브랜치 |
| --- | --- | --- |
| 채팅 코드가 있는 폴더 | 7개 (`api/services`, `api/store`, `hooks`, `types`, `utils`, `pages`, `features/chat`) | 1개 (`features/chat`) |
| 문서 제작 코드가 있는 폴더 | 6개 (+ `docgenMock.ts`) | 1개 (+ `mock/handlers/docgen.ts`) |
| 배포 빌드의 목 기본값(3-1) | 남아 있음 | 해결 |
| 규칙 검사 | 문서만 | 문서 + ESLint |
| `features/`의 뜻 | "화면 조각" | "기능의 전부" |

부분 정리의 문제는 **두 규칙이 섞인 상태가 그대로 남는다**는 점입니다. 화면 조각은 기능별로, 나머지는 종류별로 나뉩니다. 새 기능을 만드는 사람은 여전히 "API는 `api/services`, 화면은 `features`"처럼 두 체계를 함께 외워야 합니다.

또 2-7, 3-4에서 본 구조 규칙은 **모든 기능이 같은 모양일 때만** 경로 패턴으로 검사할 수 있습니다. 이를테면 "`features/*/components`에서 `**/api`를 import하면 오류"처럼요. 일부만 옮긴 구조에서는 규칙을 기계적으로 쓸 수 없습니다.

`code-cleanup`의 다른 작업(파일 나누기, 안 쓰는 코드 삭제, 채팅 버그 수정)은 이 구조와 충돌하지 않습니다. **버리지 않고 가져와야 합니다.** 방법은 8절에 있습니다.

---

## 7. 다음에 확인할 것

### 7-1. 화면 확인 (브라우저로 아직 안 봄)

`npm run dev:mock`으로 띄워서 확인해 주세요.

- [ ] **채팅:** 입력창에 글과 분야를 넣고 다른 대화로 옮겼다가 돌아오면 그대로 남아 있는가 (`ChatInput` 수정)
- [ ] **채팅:** 새 대화에서 첫 메시지를 보낸 뒤 정상으로 연결되는가, 오류 시 재시도 버튼이 동작하는가 (`ChatPage` 수정)
- [ ] **번역:** 입력을 모두 지우면 결과도 비워지는가 (`TranslatePage` 수정)
- [ ] **로그인:** 로그인 창을 닫았다 다시 열면 빈 로그인 폼부터 시작하는가, 입력 전에는 버튼이 비활성인가 (`LoginPage` 수정)
- [ ] **문서 제작:** 생성·취소·재시도·삭제, 첫 화면 입력창 위치, 삭제 확인
- [ ] **나머지 화면:** 프로젝트, 관리자, 문서 검색, 대화 검색, 이용 안내, 팀, 튜토리얼이 열리는가
- [ ] **사이드바:** 메뉴 강조, 즐겨찾기, 최근 대화

### 7-2. 알고 있어야 할 동작 변화

- **문서 제작은 일반 개발 모드(`npm run dev`)에서 동작하지 않습니다.** 3-1을 고치면서 이제 실제 서버를 부릅니다. 백엔드에 docgen API가 생기기 전까지는 `npm run dev:mock`에서만 확인할 수 있습니다.
- 문서 제작 목 데이터는 새로고침하면 사라집니다. 다른 목과 같이 메모리에만 둡니다.
- 관리자 자료실의 "재시도" 버튼은 이 브랜치에서는 동작하지 않습니다(TODO). `fix/admin-document-retry`에 구현이 있으므로 병합 시 가져옵니다.

### 7-3. 아직 남은 구조 문제

- `features/chat/store.ts`가 스트리밍 상태와 함께 지난 메시지(서버 데이터)도 들고 있습니다.
- 프로젝트 데이터의 이중 저장(`projects/store.ts`)은 이 브랜치에는 남아 있습니다. `fix/sidebar-state`의 수정을 가져오면 해결됩니다.
- `lib/axios.ts`가 `features/auth/types.ts`를 가져다 씁니다(기반 → 기능 방향).
- 큰 파일: `features/system/pages/SystemDiagnostics.tsx` 1708줄, `shared/styles/global.css` 1553줄. `projects/components/parts.tsx` 953줄은 `code-cleanup`의 분할을 가져오면 해결됩니다.
- 코드 스타일(세미콜론·따옴표)과 하드코딩 색. Prettier는 거의 모든 파일을 바꾸므로 병합이 끝난 뒤 한 번에 적용합니다.
- 빌드에 500kB 넘는 청크 경고가 있습니다.
- git 이력: 작은 서비스 파일 2개(`capability.ts` → `domains/api.ts`, `translate.ts` → `translate/api.ts`)는 이름 바꾸기로 인식되지 않아 `git log --follow`로 이전 이력이 이어지지 않습니다.

---

## 8. 병합 계획

### 8-1. 충돌 규모

`dev`와 비교해 각 브랜치가 바꾼 `src` 파일 중, 이 브랜치에서 경로가 바뀐 파일 수입니다(11/9 기준).

| 브랜치 | 바꾼 파일 | 옮겨진 경로 | 마지막 커밋 |
| --- | --- | --- | --- |
| `refactor/code-cleanup` | 97 | 82 | 11/06 |
| `fix/sidebar-state` | 27 | 26 | 11/05 |
| `release/preview` | 19 | 18 | 11/05 |
| `fix/admin-document-retry` | 15 | 14 | 11/04 |
| `document-ppt` | 40 | 27 | 10/23 |
| `document` | 37 | 26 | 10/21 |

이 정도면 손으로 충돌을 푸는 것은 현실적이지 않습니다.

### 8-2. 제안하는 순서: "다른 브랜치를 먼저 합치고, 이동은 마지막에 다시 실행"

이 브랜치의 핵심 변경은 **파일 이동과 import 경로 계산**이고, 둘 다 스크립트로 했습니다(`scripts/feature-folders/`). 그래서 충돌을 풀기보다 다시 실행하는 편이 안전합니다.

1. 기능 수정 브랜치를 먼저 `dev`에 병합합니다: `fix/sidebar-state`, `fix/admin-document-retry`, `refactor/code-cleanup`(파일 나누기·버그 수정), 필요하면 `release/preview`.
2. 새 `dev`에서 브랜치를 만들고 이 브랜치의 **이동 전 커밋들**(`74e3a9e`~`44c96c9`)을 다시 적용하거나, 이미 반영된 것은 건너뜁니다.
3. `scripts/feature-folders/migrate.mjs`의 `MAP`에 1번에서 새로 생긴 파일 위치를 추가합니다. 예를 들어 `code-cleanup`이 만든 `features/search`, `features/rag`, `utils/chatStorage.ts`, 나뉜 `projects` 파일들입니다.
4. 실행합니다.
   ```sh
   node scripts/feature-folders/import-graph.mjs . users   # 누가 무엇을 쓰는지 확인
   node scripts/feature-folders/migrate.mjs . --dry        # 옮길 목록 확인
   node scripts/feature-folders/migrate.mjs .              # git mv + import 다시 쓰기
   ```
5. 손으로 하는 단계(5절의 합침 3건, 나눔 2건)를 반복합니다. 같은 모듈을 두 번 import하게 된 파일은 `dedupe-imports.mjs`로 합칩니다.
6. `npx tsc -b`, `npm run lint`, `npm run build`, `npm run build:mock`, 7-1 화면 확인.

이 방식이면 다른 브랜치의 작업은 그대로 살리고, 구조 변경만 최신 코드 위에 다시 얹을 수 있습니다.

### 8-3. 결정이 필요한 것

- 이 구조(기능별)로 갈지, `code-cleanup`의 부분 정리로 갈지
- 진행 중인 브랜치를 언제 병합하고 이동을 언제 실행할지 (그 사이에는 큰 파일 이동을 멈춰야 합니다)
- `code-cleanup`의 README 규칙과 이 브랜치의 ARCHITECTURE.md 중 무엇을 기준 문서로 삼을지

---

## 9. 비용과 반론

공정하게 비용도 적습니다.

- **충돌:** 8절대로 진행하지 않으면 병합이 매우 아픕니다.
- **익숙함:** 팀원 모두가 새 위치를 익혀야 합니다. ARCHITECTURE.md의 "기능 목록"과 "새 코드를 어디 둘지" 표가 안내서 역할을 합니다.
- **기능 사이의 의존:** 채팅이 `domains`(분야 아이콘)를, 문서 제작이 `domains`·`auth`를 가져다 씁니다. 기능끼리 서로 import하는 것을 허용했는데, 이것이 과해지면 다시 엉킬 수 있습니다. 순환 의존이 생기면 공용 부분을 `shared`나 별도 기능으로 빼야 합니다.
- **종류별 구조가 틀린 것은 아닙니다.** 파일 150개 규모에서는 종류별 구조도 충분히 쓸 수 있습니다. 문제는 방식 자체가 아니라 **두 방식이 섞인 것**이었습니다. 앞으로 기능이 계속 늘어날 프로젝트라서 기능별 쪽이 더 오래 버틴다고 판단했습니다.
