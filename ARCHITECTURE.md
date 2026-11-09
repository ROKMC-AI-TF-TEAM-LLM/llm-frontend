# 구조와 규칙

새 기능을 넣을 때 "무엇을 어디에 두는가"의 기준입니다. ✅ 표시는 ESLint가 검사합니다(`npm run lint`).

## 폴더

| 위치 | 두는 것 |
| --- | --- |
| `src/App.tsx`, `src/main.tsx` | 라우트, 앱 시작(React Query 공급자, mock 설치) |
| `src/api/lib/axios.ts` | HTTP 클라이언트: 서버 주소, 토큰 붙이기·갱신 |
| `src/api/queryClient.ts` | React Query 전역 설정 |
| `src/api/services/<도메인>.ts` | **서버 엔드포인트 하나당 함수 하나.** 요청만 보내고 화면 로직·mock 분기는 두지 않는다 |
| `src/hooks/use<도메인>.ts` | 서비스를 감싼 React Query 훅(조회·변경·캐시 무효화). 화면은 이 훅으로만 서버를 쓴다 |
| `src/store/` | zustand 앱 상태. 서버 데이터 캐시가 아니라 화면 간 공유 상태(채팅 스트리밍, 알림) |
| `src/context/` | React Context (로그인 상태) |
| `src/types/<도메인>.ts` | 서버 요청·응답 타입 |
| `src/utils/` | 순수 함수(포맷, 응답 정규화, 상태 해석) |
| `src/mock/` | `npm run dev:mock`용 가짜 백엔드. 새 API의 가짜 응답은 `mock/handlers/<도메인>.ts`에 |
| `src/pages/` | 라우트 화면. 훅과 컴포넌트를 조립한다 |
| `src/ui/components/` | 여러 화면이 쓰는 컴포넌트 |
| `src/ui/layouts/` | 로그인·보호·관리자 레이아웃 |
| `src/features/<기능>/` | 한 기능에서만 쓰는 화면 조각·훅·타입 |

## 규칙

1. ✅ **화면(`pages`·`ui`·`features`)은 `api/services`를 직접 import하지 않는다.** `hooks/`의 훅을 거친다.
   서비스 파일에 있던 순수 함수가 필요하면 `utils/`로 옮긴다.
2. ✅ **mock 코드는 `src/mock` 안과 `main.tsx`에서만 쓴다.** 서비스에 `USE_MOCK` 같은 분기를 두지 않는다.
   mock은 fetch를 가로채므로 서비스 코드는 mock인지 모른다.
3. ✅ **라우터는 `react-router-dom`에서 가져온다.**
4. 서버 데이터는 React Query 캐시 한 곳에만 둔다. zustand에 복사해 두지 않는다.
5. 한 기능에서만 쓰면 `features/<기능>`, 두 기능 이상이 쓰면 `ui/components`·`hooks`·`utils`로 올린다.

## 아직 규칙과 다른 곳 (정리 예정)

- `features/projects/projectStore.ts`: 서버의 프로젝트 목록을 zustand에 한 번 더 복사한다(규칙 4 위반).
  사이드바·프로젝트 화면을 React Query 캐시로 바꾸면서 없앨 예정.
- 채팅·문서 검색의 화면 조각은 `features`가 아니라 `ui/components/chat`·`messages`·`rag`에 있다.
- 코드 스타일(세미콜론·따옴표)이 파일마다 다르다. Prettier는 거의 모든 파일을 바꾸므로 열린 브랜치를 병합한 뒤 한 번에 적용한다.
- 하드코딩 색(`#fdedf2` 등)과 디자인 토큰(`bg-brand` 등)이 섞여 있다. 새 코드는 토큰을 쓴다.
