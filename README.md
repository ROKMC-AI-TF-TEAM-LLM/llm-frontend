# MARS Frontend

## 실행

```sh
npm install
npm run dev        # 기존 백엔드 연동 모드
npm run dev:mock   # 백엔드 없이 UI 확인 (http://localhost:5174)
```

### Mock 모드

브라우저의 `fetch`를 가로채 `/api/v1/*` 요청을 메모리 안의 가짜 서버(`src/mock`)로 보냅니다. 서비스 코드는 그대로 두고 응답만 바뀌므로, 실제 서버와 같은 흐름(로딩·에러·토큰 갱신·SSE 스트리밍)을 확인할 수 있습니다.

- 로그인: 아무 이메일·비밀번호로 관리자 계정이 됩니다. 예: `mock@example.com` / `mock`
- 오류 화면 확인: 비밀번호 `wrong` → 인증 실패, `pending@…` → 승인 대기, `rejected@…` → 승인 거절
- 채팅은 상태 → 본문 → 출처 순서로 예시 답변을 스트리밍합니다. 업로드한 문서는 몇 초 뒤 처리 완료로 바뀝니다.
- 데이터는 새로고침하면 초기 상태로 돌아갑니다. 포트(5174)가 달라 실제 모드와 로그인 정보가 섞이지 않습니다.
- 문서 생성은 별도 mock(`src/api/services/docgenMock.ts`, `VITE_DOCGEN_MOCK`)을 사용합니다.
- 정의되지 않은 API를 부르면 콘솔에 `[mock] 정의되지 않은 API`가 찍힙니다.

| 파일 | 내용 |
| --- | --- |
| `src/mock/db.ts` | 직접 적은 예시 데이터 (사용자·채팅·프로젝트·문서) |
| `src/mock/seed.ts` | 대량 가짜 데이터 생성. 개수는 상단 `COUNT`에서 조절 |
| `src/mock/handlers/*.ts` | API별 응답 |
| `src/mock/server.ts` | 경로 매칭, 응답 형식, 지연 시간 |

Mock 코드는 `--mode mock`일 때만 불러오므로 일반 빌드에는 포함되지 않습니다.

```sh
npm run build:mock # Mock 버전 빌드
npm run build      # 일반 버전 빌드
```

## 폴더 구조

```
src/
  pages/           라우트 진입점. features 조각을 조립만 한다 (예: DocGenPage → features/docgen/DocGenWorkspace)
  features/<기능>/  한 기능(화면)에서만 쓰는 컴포넌트·화면 상태 훅(hooks.ts)·타입·아이콘
  ui/              여러 기능이 같이 쓰는 부품(components: Skeleton·Toast·DomainIcon·사이드바·랜딩)과 레이아웃(layouts)
  hooks/           서버 상태 훅(React Query, api/services·types와 이름을 맞춤)과 범용 훅(useLocalStorage 등)
  api/             axios 설정(lib), API 호출(services), 전역 상태(store)
  context/         인증(AuthProvider, useAuth)
  types/ utils/ constants/
  mock/            mock 모드 전용 가짜 백엔드
```

### 어디에 둘까

| 무엇 | 위치 |
| --- | --- |
| 서버 데이터를 읽고 쓰는 훅 (React Query) | `hooks/useX.ts` |
| 한 화면에서만 쓰는 상태 훅 | `features/<기능>/hooks.ts` |
| 한 기능에서만 쓰는 컴포넌트 | `features/<기능>/` (평평하게, 컴포넌트 파일은 대문자) |
| 두 기능 이상이 같이 쓰는 컴포넌트 | `ui/components/` |

의존 방향은 `pages → features → ui · hooks → api · utils · types` 한쪽으로만 둔다.
`hooks`·`api`·`utils`·`types`·`context`는 `features`·`ui`·`pages`를 가져다 쓰지 않는다.
기능끼리는 공개된 컴포넌트만 가져다 쓴다 (예: 채팅 출처 배지 → `features/rag/DocumentDrawer`).
