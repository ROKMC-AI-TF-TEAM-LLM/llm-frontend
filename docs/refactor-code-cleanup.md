# 코드 정리 브랜치 변경 내역 (`refactor/code-cleanup`)

`document-update`에서 갈라져 나온 브랜치입니다. 이 문서에는 무엇이, 어떻게, 얼마나 바뀌었는지와 화면에서 확인할 것을 정리했습니다.
숫자는 모두 `git show --numstat`, `git diff -M`으로 직접 센 값입니다. 커밋마다 한 번 분석하고, 다른 사람이 git으로 다시 대조해 검증했습니다.

## 한눈에 보기

| 구분 | 파일 | 추가 | 삭제 |
| --- | ---: | ---: | ---: |
| 브랜치 전체 (`document-update..HEAD`) | 110 | +2,246 | -6,296 |
| └ `fix/sidebar-state` 머지분 | 32 | +919 | -538 |
| └ 이번 정리 작업 (머지 제외) | 85 | +1,036 | -5,567 |

정리 작업만 보면 **코드가 약 4,500줄 줄었습니다.** 대부분은 문서 제작 시안 23개 파일(4,250줄)을 지운 것이고, 나머지는 안 쓰던 코드 삭제와 파일 이동입니다.

| 커밋 | 내용 | 파일 | +/- | 동작 변화 |
| --- | --- | ---: | --- | --- |
| `66dbec8` | 문서 제작 v12 화면을 파일별로 분리 | 9 | +368 / -268 | 거의 없음 |
| `a68dc89` | `origin/fix/sidebar-state` 머지 (버그 수정 17커밋) | 32 | +919 / -538 | **있음** |
| `e590838` | 문서 제작을 v12로 확정, 시안 v1~v13 삭제 | 29 | +42 / -4,343 | **있음** |
| `5aea9e8` | 문서 검색 → `features/rag` | 7 | +14 / -14 | 없음 |
| `bf05e24` | 대화 검색 → `features/search` | 4 | +4 / -4 | 없음 |
| `13a8489` | 채팅 → `features/chat`, `DomainIcon` → `ui/components` | 18 | +39 / -39 | 없음 |
| `9ae0aa9` | 프로젝트 `ui.tsx`(998줄) 분할, 안 쓰던 코드 삭제 | 11 | +867 / -1,074 | 없음 |
| `8aa67be` | lint 오류 9건 → 1건 | 19 | +51 / -39 | 조금 있음 |
| `cc639af` | README에 폴더 규칙 정리 | 1 | +22 / -57 | 없음 |

---

## 1. 문서 제작 화면 (`66dbec8`, `e590838`)

### 1단계: v12 화면을 파일별로 나눔 (`66dbec8`)

282줄짜리 시안 파일 `DraftV12.tsx` 하나에 있던 화면을 역할별 파일로 나눴습니다. 상태와 보내기 로직은 이름만 바뀌었습니다(`sideOpen` → `previewOpen`, `doneJobs` → `finishedJobs`). 동작 순서는 그대로 `useDocGenWorkspace` 훅으로 옮겼습니다.

| 새 파일 (`features/docgen/`) | 줄 | 하는 일 |
| --- | ---: | --- |
| `DocGenWorkspace.tsx` | 60 | 화면 배치. 미리보기가 열리면 두 열, 닫히면 가운데 한 열 |
| `PromptBox.tsx` | 32 | 입력창 + 분야·파일 유형·양식 칩 + 전송 버튼 |
| `ProgressList.tsx` | 45 | 진행 상황 (대기·생성 중 작업) |
| `DocumentList.tsx` | 42 | 생성 문서 (완료·실패·취소 작업) |
| `PreviewPanel.tsx` | 93 | 오른쪽 미리보기. 생성 중에는 스켈레톤, 끝나면 문서 |
| `motion.tsx` | 29 | 공통 전환 `MOTION`, 접고 펴기 `Collapse`, 나타나기 `FadeIn` |
| `hooks.ts` (기존) | +46 | 화면 상태 훅 `useDocGenWorkspace` 추가 |

### 2단계: v12로 확정 (`e590838`)

**라우트**

| 주소 | 이전 | 이후 |
| --- | --- | --- |
| `/docgen` | `/docgen/v13`으로 리다이렉트 | `DocGenPage`(v12)를 바로 보여 줌 |
| `/docgen/v1` ~ `/docgen/v13` | 시안 13개 | 삭제 → 없는 페이지(ErrorPage)로 처리 |

**삭제:** `src/pages/docgen/drafts/` 폴더 전체를 지웠습니다(23개 파일, 4,250줄). 시안 v1~v13, 시안 전환 막대 `DraftBar`, 엠블럼 실험 파일 6개가 포함됩니다.

**시안에서만 쓰던 코드**

| 처리 | 대상 |
| --- | --- |
| 삭제 | `useDocGenPage`, `useJobSelection`, `PreviewActions`, `resetDocGenMock`, 그리고 `DownloadButton`의 `primary` 옵션(`PreviewActions`만 쓰던 것) |
| export 해제 (파일 안에서만 씀) | `Paper`, `EmptyPreview`, `FailedNotice`, `Picker`, `DownloadButton` |

**새 파일:** `src/pages/DocGenPage.tsx` (11줄). 탭 제목을 설정하고 `<DocGenWorkspace />`를 그립니다.

### 사용자에게 보이는 변화

- `/docgen`을 열면 v13(스테이지) 대신 **v12 화면**이 나옵니다.
- 화면 위쪽의 시안 전환 막대가 없어졌고, 스크롤 영역이 화면 높이를 전부 씁니다.
- 탭 제목이 `문서 제작 - MARS`로 바뀝니다. 페이지를 떠나면 `MARS`로 돌아갑니다.
- **작업이 초기화되지 않습니다.** 예전에는 시안을 열 때마다 목(mock) 작업과 캐시를 비웠습니다. 이제는 새로고침해도 같은 탭에서 만든 작업이 남습니다.
- 작은 차이:
  - 미리보기에 띄운 작업을 목록에서 삭제하면, 미리보기 머리 아이콘이 문서 아이콘 대신 스피너로 보입니다.
  - 진행 상황의 "대기 중 · 앞에 N건" 문구에도 고정폭 숫자(`tabular-nums`)가 붙습니다.

---

## 2. 폴더 이동 (`5aea9e8`, `bf05e24`, `13a8489`)

**바뀐 줄은 모두 import 경로입니다.** 로직, JSX, 스타일, export 이름은 그대로입니다. 이동한 파일 20개 중 6개는 내용이 100% 같고, 나머지 14개도 import 줄만 다릅니다.

| 이전 | 이후 | 파일 |
| --- | --- | --- |
| `ui/components/rag/*` | `features/rag/*` | `DocumentDrawer`, `RagDetail`, `RagListItem`, `RagSearchInput` |
| `hooks/useDocumentDrawer.ts` | `features/rag/hooks.ts` | 이름만 바뀜, export는 그대로 |
| `ui/components/search/*` | `features/search/*` | `SearchInput`, `SearchResultItem`, `SearchResults` |
| `ui/components/chat/{ChatInput,DomainPicker}` | `features/chat/` | |
| `ui/components/messages/*` (9개) | `features/chat/` | `MessageList`, `MessageBubble`, `SourceBadge` 등 |
| `ui/components/chat/DomainIcon.tsx` | `ui/components/DomainIcon.tsx` | 문서 제작·관리자·가이드에서도 쓰는 공용 부품 |

- **경로만 고친 바깥 파일 (9개):** `RagPage`, `SearchPage`, `ChatPage`, `NewChatPage`, `ProjectPage`, `AdminDocuments`, `GuidePage`, `features/docgen/components`, `SourceBadge`
- **이렇게 옮긴 이유:** 예전에는 공용 훅(`hooks/useDocumentDrawer`)이 특정 화면 컴포넌트(`DocumentDrawer`)를 가져다 쓰는 역방향 의존이 있었습니다. 이번 이동으로 그 관계가 없어졌습니다.

---

## 3. 프로젝트 화면 분할 (`9ae0aa9`)

998줄짜리 `features/projects/ui.tsx`를 역할별 파일로 나눴습니다. 커밋 메시지에는 "953줄"이라고 적혀 있는데, 예전 시점의 숫자가 남은 것이고 실제로는 998줄입니다.

| 새 파일 | 줄 | 들어 있는 것 |
| --- | ---: | --- |
| `primitives.tsx` | 187 | `Mark`, `Block`, `IconButton`, `FavStar`, `KebabMenu`, `ProjectPath` |
| `rows.tsx` | 252 | `ProjectDocRow`, `UploadingDocRow`, `ChatRow`, `EmptyFiles` |
| `Instruction.tsx` | 133 | `InstructionBody`, `InstructionModal` |
| `CreateProjectModal.tsx` | 124 | 새 프로젝트 모달 (default export) |
| `FilesModal.tsx` | 156 | 파일 모달 (default export) |
| `types.ts` | 8 | `ProjectChat` 타입 (`mock.ts`에서 이름 바꿈) |

- **함수 본문:** 옮긴 함수 18개의 본문이 그대로인지 해시로 비교했고, 모두 같습니다. 모달 두 개만 `export` 방식이 named에서 default로 바뀌었습니다.
- **아이콘:** `ui.tsx`가 아이콘을 다시 내보내던 줄을 지웠습니다. 이제 각 파일이 `icons.tsx`에서 바로 가져옵니다.

**삭제한 코드** (커밋 직전 트리를 `git grep`으로 확인했고, 아무 데서도 쓰지 않았습니다)

| 삭제 | 줄 | 비고 |
| --- | ---: | --- |
| `Composer` (프로젝트 입력창) | 142 | 프로젝트 채팅이 공용 `ChatInput`으로 바뀌면서 남은 코드 |
| `FileRow` | 19 | |
| `Project`, `ProjectFile` 타입 | | |
| 아이콘 4개 (`ChatIcon`, `SearchIcon`, `ChevronRight`, `ChevronDown`) | 25 | |

---

## 4. lint 정리 (`8aa67be`)

| 규칙 | 전 | 후 | 어떻게 고쳤나 |
| --- | ---: | ---: | --- |
| `no-empty` (빈 블록) | 4 | 0 | 의도를 설명하는 주석 추가. `chat.ts`, `ChatInput`, `chunkReload`, `postLoginRedirect` |
| `react-refresh/only-export-components` | 2 | 0 | `AuthContext`·`useAuth`를 `context/useAuth.ts`로 분리. import 경로만 바뀐 파일 12개 |
| `react-hooks/set-state-in-effect` | 2 | 0 | `ChatInput`, `TranslatePage` 구조 변경 (아래) |
| `no-unused-vars` | 1 | 1 | 남김 (아래 "남은 일" 참고) |
| 경고 (`exhaustive-deps`, `incompatible-library`) | 2 | 2 | 남김 |
| **합계** | **오류 9 / 경고 2** | **오류 1 / 경고 2** | |

**동작이 바뀐 부분**

- **채팅 입력창 (`ChatInput`):** 대화를 옮길 때 그 대화의 입력 초안과 분야를 되살리는 방식이 바뀌었습니다.
  - 전에는 effect가 처리해서, 이전 대화의 입력값이 한 프레임 보였다가 바뀌었습니다.
  - 이제는 렌더 중에 바로 바꿔서 그 깜빡임이 없습니다.
  - 초안을 저장하는 곳은 그대로라서, 대화끼리 초안이 섞일 위험은 새로 생기지 않았습니다.
- **번역 (`TranslatePage`):** 입력을 다 지우면 결과도 지우는 시점이 effect에서 입력 변경 시점으로 옮겨졌습니다.
  - 번역 요청 중에 입력을 지운 경우, 예전에는 언어를 바꾸면 결과가 지워졌지만 이제는 남습니다.
  - 지금은 번역 라우트가 꺼져 있어서 화면에는 영향이 없습니다.
- **인증:** 코드는 그대로 두고 위치만 옮겼습니다. `App.tsx`는 계속 `AuthContext`에서 `AuthProvider`를 가져옵니다.

---

## 5. `fix/sidebar-state` 머지 (`a68dc89`)

`origin/fix/sidebar-state`의 17커밋(그중 머지 커밋 4개)을 충돌 없이 합쳤습니다. 32개 파일, +919 / -538줄입니다. 이 브랜치에는 버그 수정 외에 `release/preview`에서 머지된 배포 설정도 섞여 있습니다.

**들어온 동작 변화**

| 영역 | 변화 |
| --- | --- |
| 채팅 | 답변을 다시 만들 때 원래 질문의 분야도 같이 보냄 |
| 채팅 | 답변을 만드는 동안 사고 과정을 토글 없이 항상 표시. 완료 후 "N초 동안 생각함" 접기는 없어짐 |
| 채팅 | 답변이 나오는 중에 새 대화를 시작해도 이전 답변이 중단되지 않고 끝까지 받아짐 |
| 채팅 | 중지 버튼이 대화별로 동작해서, 다른 대화를 다녀와도 원래 스트림을 멈춤 |
| 채팅 | 프로젝트 안의 대화들이 입력 초안을 공유하던 문제 수정 |
| 사이드바 | 대화·프로젝트를 삭제할 때 확인 창이 뜸. 프로젝트 삭제가 서버까지 감 (예전에는 화면 목록에서만 빠져서 새로고침하면 다시 나타남) |
| 사이드바 | 프로젝트 목록의 출처를 React Query 캐시 하나로 통일 (`projectStore.ts` 삭제) |
| 프로젝트 | 파일 업로드 다시 켬. 업로드 중에는 추가 업로드를 막고, 문서 삭제 전에 확인 창을 띄움 |
| 관리자 문서 | 무한 스크롤. 검색어를 300ms 디바운스해서 서버로 보냄 |
| 로그아웃·토큰 만료 | 브라우저에 저장된 대화 캐시를 지움 |
| 번역 | 메뉴, 라우트, 튜토리얼을 주석 처리해서 숨김 |
| 입력창 전체 | 브라우저 맞춤법 검사 끔 (`index.html`) |

**설정 변화 (주의)**

- **`.env` 추적 해제:** `.env`가 저장소에서 빠지고 `.env.example`이 생겼습니다.
  - pull하면 각자 로컬의 `.env`도 지워집니다. `.env.example`을 복사해서 `VITE_SERVER_API_URL`을 채워야 합니다.
  - 개발 서버에는 프록시 설정이 없습니다. 그래서 `.env`가 없으면 백엔드에 연결되지 않습니다.
- **스트림 타임아웃:** 지워진 `.env`에는 스트림 무응답 타임아웃이 10분(`600000`)으로 들어 있었습니다. 값이 없으면 기본값 20분이 쓰입니다.
- **`vercel.json` 추가:** `/api`를 Cloud Run 백엔드로 리라이트하고, 나머지 경로는 `index.html`로 보냅니다. 백엔드 주소가 파일에 직접 적혀 있습니다.

---

## 6. README (`cc639af`)

- **추가:** 루트 `README.md`에 폴더별 역할, "어디에 둘까" 표, 의존 방향 규칙을 적었습니다.
- **삭제:** Vite 템플릿의 영문 기본 안내를 지웠습니다.
- **규칙 점검:** "`hooks`·`api`·`utils`·`types`·`context`는 `features`·`ui`·`pages`를 가져다 쓰지 않는다"는 규칙을 어기는 import를 찾아봤고, 0건입니다.

---

## 화면에서 확인할 것

빌드(`npm run build`)와 타입 검사는 통과했습니다. 아직 화면을 직접 눌러 보지는 않았습니다.

- [ ] `/docgen`: v12 화면이 바로 뜨는지, 전송 → 스켈레톤 → 문서가 나타나는지, 진행 상황·생성 문서 목록이 동작하는지
- [ ] `/docgen/v12` 같은 예전 주소가 없는 페이지로 가는지
- [ ] 채팅: 대화 A·B에 다른 초안과 분야를 넣고 오갈 때 각자 제대로 돌아오는지, 여러 줄 초안일 때 입력창 높이가 맞는지
- [ ] 채팅: 출처 배지를 누르면 문서 서랍이 열리는지
- [ ] 로그인, 로그아웃, 보호 페이지 이동
- [ ] 프로젝트: 지침 보기·편집, 파일 모달, 사이드바의 "새 프로젝트" 모달
- [ ] 사이드바에서 대화·프로젝트 삭제 (확인 창, 목록 갱신)
- [ ] 문서 검색(`/rag`) 목록과 상세 서랍, 대화 검색

## 남은 일

| 항목 | 상태 |
| --- | --- |
| 관리자 문서 "재시도" 버튼 | 함수가 비어 있어서 눌러도 아무 일이 없습니다. lint 오류 1건도 여기서 나옵니다. `origin/fix/admin-document-retry`(`35db111`)에 구현이 있으니, 머지할지 정해야 합니다 |
| 문서 제작 메뉴 | 사이드바에 진입점이 없어서 주소로만 들어갈 수 있습니다 |
| 문서 제작 백엔드·다운로드 | 목(mock)으로 동작합니다. `features/docgen/README.md`의 "남은 일" 참고 |
| `features/projects/icons.tsx`의 `ArrowLeft` | 쓰는 곳이 없어 보이는데 남아 있습니다 |
| lint 경고 2건 | `ChatPage` effect 의존성(의도적으로 뺐을 수 있음), `LoginPage`(react-hook-form 호환성 문제) |
| 커밋 메시지 | `9ae0aa9`의 "953줄"은 실제로 998줄입니다 |
