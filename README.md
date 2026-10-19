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

## Vite 참고

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,

    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```
