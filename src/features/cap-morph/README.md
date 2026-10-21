# Cap morph lab

대한민국 해병대 체육모와 팔각모 사진을 참고한 독립 3D 전송·중단 버튼 실험입니다. 기존 채팅, 문서 API, V1–V6 시안에는 연결하지 않았습니다.

## 실행

```sh
npm install
npm run dev
```

Vite가 표시한 주소의 `/docgen/cap-morph-lab`을 엽니다. 예: `http://localhost:5173/docgen/cap-morph-lab`. 실험실은 로그인 없이 열리는 별도 목업 라우트입니다. 기존 보호 라우트의 인증 정책은 그대로입니다. 입력창은 로컬 타이머로 대기 → 생성 → 완료를 재현하며 서버 요청을 하지 않습니다. PowerShell의 스크립트 실행 정책이 npm.ps1을 차단하면 `npm.cmd`를 사용하세요.

실험실에서 40/44/48px 버튼, 확대 모델, 네 상태, 재생/일시 정지, 양방향 변형, 속도, 0–100% 프레임 탐색을 비교할 수 있습니다. 확대 모델을 드래그하거나 두 손가락으로 회전/확대할 수 있습니다. 키보드 포커스 후 방향키로 회전, `+`/`-`로 확대/축소, `Home`으로 시점을 초기화합니다. 입력창의 완료/실패 재현 버튼은 생성 중 사용할 수 있습니다.

## 구성

- `components/MorphingSendButton.tsx`: 비즈니스 상태를 받는 접근 가능한 버튼. 전송/중단 콜백은 애니메이션 완료를 기다리지 않습니다.
- `hooks/useCapMorphAnimation.ts`: 780ms 기본 전환, 연속 역전, 프레임 탐색, 속도, 일시 정지, 시스템 모션 설정을 처리하는 독립 컨트롤러.
- `components/MarineCapScene.tsx`: Three.js 스튜디오, 카메라 조작, 필요한 순간만 렌더링, WebGL 대체 표시 및 컨텍스트 복구.
- `three/createCapModel.ts`: 동일 토폴로지의 두 모자 형태, 크라운/챙/테두리/실밥/통풍구/패치의 실제 3D 메시와 morph targets.
- `three/fabricMaterials.ts`: 직접 생성하는 디지털 위장·트윌 base color, normal, roughness, AO 텍스처와 공간을 따라 이동하는 재질 전환.
- `types.ts`, `index.ts`, `styles/button.css`, `components/scene.css`: 공개 API와 독립 스타일.
- `../../pages/docgen/experiments/CapMorphLab.tsx`, `cap-morph-lab.css`: 실험실과 입력창 목업.
- `../../../scripts/cap-morph-animation-check.mjs`: 애니메이션 및 빠른 전송/취소 회귀 검사.

`src/App.tsx`에는 실험실용 lazy route만 추가합니다. 런타임 의존성 `three`는 실제 3D 메시, PBR 재질, GPU morph targets와 카메라 조작을 위해 필요합니다. `@types/three`는 개발 시 타입 검사용입니다. 별도의 애니메이션·React 3D 프레임워크는 추가하지 않았습니다.

## 향후 V7 통합

```tsx
import { MorphingSendButton } from '../../../features/cap-morph';

<MorphingSendButton
  state={jobState}
  onSend={handleSend}
  onStop={handleStop}
  size={44}
  disabled={!isBusy && !prompt.trim()}
/>
```

`state`는 `idle | queued | running | completed | failed`입니다. `queued`와 `running`은 중단 동작과 팔각모로, 나머지는 전송 동작과 체육모로 매핑합니다. 서버의 취소 상태는 통합 측에서 `idle` 등으로 변환합니다. `onSend`에서 즉시 `queued`를 반영하고, 완료/실패/취소 시 최종 상태를 반영하세요. 콜백의 네트워크 처리, AbortController, 중복 요청 제어는 호출자가 담당합니다. 생성 중에도 중단이 가능하도록 busy라는 이유만으로 `disabled`를 설정하지 마세요.

선택적인 `progress`(0–1)는 실험실처럼 외부 타임라인을 표시할 때 사용합니다. 이 경우 버튼의 자체 애니메이션은 꺼지고 클릭 동작/아이콘은 여전히 `state`를 따릅니다. `durationMs`, `reducedMotion`, `aria-label`, `className`을 지원합니다. OS의 reduced-motion 설정은 항상 존중합니다. 현재 단계에서는 `DraftV7.tsx`를 만들거나 API에 연결하지 않습니다.

## 모델 출처와 한계

Blender 실행 환경과 검증된 실물 GLB가 없어 사진을 참고해 TypeScript로 직접 제작했습니다. 외부 모델, 스캔 텍스처 또는 이미지 생성 에셋을 사용하지 않습니다. 문양은 독수리·닻·별을 직접 그린 근사 표현이고 위장 패턴도 직접 생성한 근사 패턴입니다. 공식 문양, 공식 위장 원본, 실측 복원 또는 사진 수준의 재현을 의미하지 않습니다.

후속 품질 개선에는 실측 치수, 정식 문양 원본, UV가 정리된 리토폴로지 모델과 베이크한 재질이 필요합니다. 기존 컨트롤러/버튼 API를 유지한 채 모델 생성 부분을 GLB 기반의 공통 토폴로지/morph targets로 교체할 수 있습니다.

## 성능과 대체 동작

Three.js는 실험실/장면 청크로 지연 로딩됩니다. 평상시에는 연속 렌더링 루프가 없고, 프레임 변경·리사이즈·카메라 조작에만 렌더링합니다. 탭이 숨겨지면 애니메이션을 멈추고 복귀 시 이어서 진행합니다. 화면 밖 장면은 렌더링하지 않습니다. 언마운트 때 RAF, 이벤트, 컨트롤, 메시·재질·텍스처·WebGL 자원을 해제합니다.

모바일/작은 버튼에는 낮은 메시 세분화와 512px 직물 텍스처를, 확대 데스크톱 뷰에는 높은 세분화와 1024px 텍스처를 사용합니다. 모자 메시를 재질별 5개 배치로 합쳐 draw call을 줄이고, 그림자는 별도의 무거운 shadow pass 없이 부드러운 contact shadow로 표시합니다. DPR은 데스크톱 1.5, 모바일 1로 제한합니다. 텍스처 CPU 데이터는 참조 수로 공유하지만 각 WebGL 컨텍스트에는 GPU 사본이 필요합니다. 실험실은 비교를 위해 여러 컨텍스트를 사용하므로 실제 서비스에서는 입력창 한 곳에 버튼 하나를 두는 것을 권장합니다. 60fps는 목표이며 모바일 실기기에서 보장된 측정값은 아닙니다.

포인터 접근/터치/키보드 포커스에서 작은 장면을 미리 준비하고 정적 상태로 보관합니다. 처음 GPU를 준비하는 동안에도 전송/중단 콜백은 즉시 실행하며, 첫 프레임 준비 후 시각적 애니메이션을 시작합니다. 준비된 장면도 idle에서는 렌더링 루프가 없습니다.

WebGL 생성/셰이더 오류와 컨텍스트 손실은 정적 대체 표시로 처리하고 버튼의 접근 가능한 전송/중단 동작은 유지합니다. OS 또는 실험실의 모션 최소화가 켜지면 회전 없이 상태를 전환합니다.

## 검증

```sh
node scripts/cap-morph-animation-check.mjs
npx eslint src/features/cap-morph src/pages/docgen/experiments/CapMorphLab.tsx src/App.tsx
npm run build
```

회귀 검사는 실제 소스의 컨트롤러와 버튼 이벤트 핸들러를 TypeScript로 변환해 실행합니다. 역방향 연속성, 취소, 속도, 탭 숨김, 프레임 탐색, 수동 상태, reduced-motion, 정지 시 RAF 없음, 전송/취소/재전송을 확인합니다. DOM·GPU 렌더링은 별도의 브라우저 검증이 필요합니다.
