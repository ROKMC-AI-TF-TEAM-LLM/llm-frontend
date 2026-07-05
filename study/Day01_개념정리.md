# 📘 Day 1 — 프론트엔드 개념 정리

> 이 프로젝트(llm-frontend)에서 실제로 겪었거나, 코드에 숨어 있는 개념 3가지.
> 각 개념은 **① 무엇인가 → ② 왜 문제였나 → ③ 어떻게 해결했나 → ④ 기억할 핵심** 순서로 정리.

---

## 1. Secure Context(보안 컨텍스트)와 `crypto.randomUUID()`

### ① 무엇인가
브라우저의 어떤 기능들은 **"안전한 환경"에서만 동작**하도록 막혀 있다. 이 "안전한 환경"을 **Secure Context(보안 컨텍스트)** 라고 부른다.

Secure Context로 인정되는 경우:
- `https://` 로 접속했을 때
- `http://localhost` 또는 `http://127.0.0.1` (개발 편의를 위한 예외)

Secure Context가 **아닌** 경우:
- `http://172.16.3.205` 처럼 **IP 주소 + HTTP** 로 접속했을 때
- `http://` 로 된 일반 도메인

`crypto.randomUUID()`, `navigator.clipboard`, `ServiceWorker`, 위치 정보(Geolocation) 등이 모두 Secure Context에서만 제공된다.

### ② 왜 문제였나 (우리가 겪은 이슈)
`crypto.randomUUID()` 로 메시지 ID를 만들고 있었는데, 사내 IP(`http://172.16.3.205`)로 접속하니 `crypto.randomUUID` 가 **`undefined`** 였다.
→ 함수가 아닌 걸 호출하려니 **`TypeError: crypto.randomUUID is not a function`** 이 터지고, 메시지 전송 자체가 죽었다.
→ 로컬(`localhost`)에서는 멀쩡했기 때문에 원인을 찾기가 특히 어려웠다. "내 코드는 똑같은데 왜 서버에서만 죽지?"의 전형.

### ③ 어떻게 해결했나
`crypto.randomUUID`가 없으면 **직접 UUID를 만들어 쓰는 폴백(fallback)** 함수를 만들었다. (`src/utils/uuid.ts`)

```ts
export const uuid = (): string => {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()   // 있으면 그냥 씀

  // 없으면 랜덤 16바이트로 직접 RFC4122 v4 UUID 생성
  const bytes = new Uint8Array(16)
  if (c?.getRandomValues) c.getRandomValues(bytes)
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)

  bytes[6] = (bytes[6] & 0x0f) | 0x40  // version = 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80  // variant
  // ...16진수로 변환해서 8-4-4-4-12 형태로 조립
}
```

핵심 아이디어 2가지:
- **`c?.randomUUID`** 처럼 옵셔널 체이닝으로 "있으면 쓰고 없으면 넘어간다".
- 브라우저 API가 없을 수도 있다고 가정하고 **대체 경로(폴백)를 항상 준비**한다.

### ④ 기억할 핵심
> "localhost에서는 되는데 실제 서버(IP/HTTP)에서 안 되는" 브라우저 기능을 만나면 **Secure Context**를 의심하라.
> 최신 브라우저 API(`randomUUID`, `clipboard` 등)를 쓸 땐 **`if (api) ... else 폴백`** 을 습관화.

🔗 확인용 코드: `MDN "Secure contexts"` 검색 / 콘솔에서 `window.isSecureContext` 찍어보기

---

## 2. 불변성(Immutability)과 상태 업데이트

### ① 무엇인가
React/Zustand 같은 상태 관리에서는 **기존 배열/객체를 직접 바꾸지 않고, 새 배열/객체를 만들어 교체**한다. 이것을 **불변성(Immutability)** 이라고 한다.

- ❌ 직접 수정(mutation): `messages[0].content = '수정'`
- ✅ 새로 만들기: `messages.map(m => m.id === id ? { ...m, content: '수정' } : m)`

### ② 왜 문제였나
React는 "상태가 바뀌었는지"를 **참조(주소)가 바뀌었는지**로 판단한다. 배열 내부만 슬쩍 바꾸면 배열의 주소는 그대로라서, **React가 변화를 눈치채지 못하고 화면을 다시 그리지 않는다.**
→ "데이터는 분명 바뀌었는데 화면이 안 바뀌는" 유령 버그의 주범.

### ③ 우리 코드에서 어떻게 쓰나
`chatStore.ts`에서 스트리밍 토큰이 올 때마다 특정 메시지의 `content`를 이어붙이는데, 전부 불변성으로 처리한다:

```ts
set((state) => ({
  messages: state.messages.map((m) =>
    m.id === assistantId && m.type === 'text'
      ? { ...m, content: m.content + chunk }  // 바뀐 것만 새 객체
      : m                                     // 나머지는 그대로 재사용
  ),
}))
```

- `map`은 **새 배열**을 만든다 → React가 "배열 바뀜"을 인식.
- `{ ...m, content: ... }` 는 **바뀐 메시지만 새 객체**로 → 그 메시지 컴포넌트만 다시 그림.
- 안 바뀐 `m`은 **같은 객체 그대로** 넘긴다 → 나머지 메시지는 불필요한 리렌더가 안 일어남(성능).

### ④ 기억할 핵심
> 상태를 바꿀 땐 **"복사해서 새로 만든다"**. 스프레드(`...`)와 `map`/`filter`가 기본 도구.
> "값은 바뀐 것 같은데 화면이 안 바뀐다" → 십중팔구 **원본을 직접 수정(mutation)** 한 것.

🔗 확인용 코드: `chatStore.ts`의 `set((state) => ({ messages: state.messages.map(...) }))` 패턴들

---

## 3. AbortController — 진행 중인 요청/스트림 취소하기

### ① 무엇인가
`AbortController`는 **이미 시작한 비동기 작업(fetch, SSE 스트림 등)을 도중에 취소**하기 위한 표준 도구다.

구조는 딱 3개:
- `const controller = new AbortController()` — 리모컨을 하나 만든다
- `controller.signal` — 이 신호를 fetch 등에 넘겨준다
- `controller.abort()` — 이 버튼을 누르면 신호를 받은 작업이 중단된다

### ② 왜 필요했나
채팅에서 이런 상황들이 있다:
- 사용자가 답변 스트리밍 중에 **"중지" 버튼**을 누른다.
- 답변을 받는 도중 **다른 세션(채팅방)으로 이동**한다 → 이전 요청은 이제 필요 없다.

이때 취소 없이 두면, 죽은 요청이 계속 응답을 받아 **엉뚱한 화면에 글자를 쏟거나** 리소스를 낭비한다.

### ③ 우리 코드에서 어떻게 쓰나
```ts
// 메시지 보낼 때 컨트롤러를 만들고 저장
const controller = new AbortController()
set({ abortController: controller, isStreaming: true })
await executeStream(sessionId, assistantId, content, isFirst, controller.signal)

// 중지 버튼
abortStream: () => {
  get().abortController?.abort()   // 신호 발사
  set({ abortController: null, isStreaming: false })
}
```

그리고 취소로 인한 에러는 **"진짜 에러"와 구분**해야 한다. 사용자가 일부러 멈춘 걸 "오류 발생!"이라고 띄우면 안 되니까:

```ts
const isAbortError = (e: unknown) =>
  (e instanceof DOMException && e.name === 'AbortError') || axios.isCancel(e)
```

`connect()`에서도 세션을 이동하면 이전 `connectAbortController.abort()`로 옛 요청을 정리한다.

### ④ 기억할 핵심
> 오래 걸리는 요청/스트림에는 **항상 취소 수단(AbortController)** 을 붙여라.
> 취소로 발생한 에러(`AbortError`)는 **정상 흐름**이다 → 에러 메시지를 띄우지 말고 조용히 무시.

🔗 확인용 코드: `chatStore.ts`의 `abortStream`, `isAbortError`, `connectAbortController`

---

## 🧠 오늘의 한 줄 요약
| 개념 | 한 문장 |
|------|---------|
| Secure Context | HTTPS/localhost가 아니면 최신 브라우저 API가 `undefined`일 수 있다 → 폴백 준비 |
| 불변성 | 상태는 직접 고치지 말고 복사해서 새로 만든다 (`...`, `map`, `filter`) |
| AbortController | 진행 중인 요청은 취소할 수 있어야 하고, 취소 에러는 정상이다 |

## ✅ 복습 질문 (내일 나에게)
1. `localhost`에선 되는데 `http://192.168.x.x`에선 특정 기능이 죽었다. 가장 먼저 뭘 의심할까?
2. 배열의 한 항목만 바꿨는데 화면이 안 바뀐다. 코드에서 뭘 확인해야 할까?
3. 사용자가 "중지"를 눌렀을 때 콘솔에 빨간 에러가 뜬다. 이게 진짜 버그일까?
