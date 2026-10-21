import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { MorphingSendButton } from '../../../features/cap-morph/components/MorphingSendButton';
import { useCapMorphAnimation } from '../../../features/cap-morph/hooks/useCapMorphAnimation';
import './cap-morph-lab.css';

const MarineCapScene = lazy(() => import('../../../features/cap-morph/components/MarineCapScene'));

type MockState = 'idle' | 'queued' | 'running' | 'completed' | 'failed';
const phaseLabels = { idle: '전송 대기', transforming: '팔각모로 변형', running: '생성 중', returning: '체육모로 복귀' };

function Arrow({ reverse = false }: { reverse?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: reverse ? 'rotate(180deg)' : undefined }}><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MockComposer() {
  const [prompt, setPrompt] = useState('해병대 신병 교육을 위한 주간 훈련 계획서를 작성해 줘.');
  const [state, setState] = useState<MockState>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pending = useRef(false);
  const busy = state === 'queued' || state === 'running';
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const finish = (next: MockState) => {
    clear();
    pending.current = false;
    setState(next);
  };
  const send = () => {
    if (!prompt.trim() || pending.current) return;
    pending.current = true;
    setState('queued');
    timers.current.push(setTimeout(() => setState('running'), 850));
    timers.current.push(setTimeout(() => finish('completed'), 6500));
  };
  const message = {
    idle: '프롬프트를 입력하고 전송 버튼을 눌러 보세요.',
    queued: '문서 생성 대기 중…',
    running: '훈련 계획서를 작성하고 있습니다…',
    completed: '시뮬레이션이 완료되었습니다. 버튼이 전송 상태로 돌아왔습니다.',
    failed: '실패 상태를 재현했습니다. 다시 전송할 수 있습니다.',
  }[state];
  return <section className="cap-lab-composer-section" aria-labelledby="composer-title">
    <div className="cap-lab-section-heading">
      <div><span className="cap-lab-eyebrow">IN CONTEXT</span><h2 id="composer-title">문장을 보내는 작은 순간</h2><p>문서 생성 입력창에서 전송과 중단을 경험해 보세요.</p></div>
      <span className="cap-lab-tag">로컬 시뮬레이션</span>
    </div>
    <form className="cap-lab-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
      <label htmlFor="cap-mock-prompt" className="cap-lab-sr-only">문서 생성 프롬프트</label>
      <textarea id="cap-mock-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="어떤 문서를 만들어 드릴까요?" rows={3} disabled={busy} />
      <div className="cap-lab-composer-toolbar"><span className="cap-lab-document-chip"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 2.5h7l3 3v12H5zM12 2.5V6h3M8 10h4M8 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>훈련 계획서<span>HWPX</span></span>
        <MorphingSendButton state={state} onSend={send} onStop={() => finish('idle')} size={44} disabled={!busy && !prompt.trim()} />
      </div>
    </form>
    <div className="cap-lab-composer-status"><p role="status"><span className={`cap-lab-status-dot ${busy ? 'is-busy' : ''}`} />{message}</p><div><button type="button" onClick={() => finish('completed')} disabled={!busy}>완료 재현</button><button type="button" onClick={() => finish('failed')} disabled={!busy}>실패 재현</button></div></div>
    <p className="cap-lab-fine-print">실제 문서를 생성하거나 서버에 프롬프트를 보내지 않습니다.</p>
  </section>;
}

export default function CapMorphLab() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cameraReset, setCameraReset] = useState(0);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const animation = useCapMorphAnimation({ reducedMotion: reduceMotion || undefined });
  const percent = Math.round(animation.progress * 100);
  const active = animation.target === 1;
  const direction = (target: 0 | 1) => animation.playTo(target);
  const replay = () => {
    if (animation.isPlaying) animation.pause();
    else if (animation.progress > 0 && animation.progress < 1) animation.resume();
    else direction(animation.progress === 1 ? 0 : 1);
  };
  const setPhase = (phase: keyof typeof phaseLabels) => {
    if (phase === 'idle') animation.seek(0);
    if (phase === 'running') animation.seek(1);
    if (phase === 'transforming') { animation.seek(0); direction(1); }
    if (phase === 'returning') { animation.seek(1); direction(0); }
  };

  return <div className="cap-lab">
    <header className="cap-lab-header"><a className="cap-lab-brand" href="/docgen/cap-morph-lab" aria-label="ROKMC AI 모자 변형 실험실"><span className="cap-lab-brand-mark">R<span /></span><strong>ROKMC <span>AI</span></strong><i /> <span className="cap-lab-brand-sub">Interaction Lab</span></a><span className="cap-lab-edition">EXPERIMENT 01 <span>·</span> CAP MORPH</span></header>
    <main className="cap-lab-main">
      <section className="cap-lab-intro"><div><span className="cap-lab-eyebrow"><span className="cap-lab-red-dash" />THE FORM OF ACTION</span><h1>작은 움직임,<br className="cap-lab-mobile-break" /> 선명한 정체성.</h1><p>체육모에서 팔각모로. 전송에서 실행으로.<br />해병대의 두 모자를 하나의 움직임으로 연결합니다.</p></div><div className="cap-lab-intro-note"><span>RED → FIELD</span><p>하나의 버튼, 두 가지 임무.</p><span className="cap-lab-tag">3D 인터랙션 프로토타입</span></div></section>

      <div className="cap-lab-workspace">
        <section className="cap-lab-stage-card" aria-labelledby="stage-title">
          <div className="cap-lab-stage-heading"><div><span className="cap-lab-eyebrow">01 / LIVE PREVIEW</span><h2 id="stage-title">형태를 살펴보세요</h2></div><span className={`cap-lab-state-pill ${active ? 'is-field' : ''}`}><span />{phaseLabels[animation.phase]}</span></div>
          <div className="cap-lab-stage">
            <span className="cap-lab-stage-watermark" aria-hidden="true">{percent < 50 ? 'RED' : 'FIELD'}</span>
            <Suspense fallback={<span className="cap-lab-scene-loading">3D 미리보기 준비 중</span>}><MarineCapScene progress={animation.progress} interactive resetKey={cameraReset} reducedMotion={animation.reducedMotion} onAvailabilityChange={setWebgl} className="cap-lab-viewer" /></Suspense>
            <div className="cap-lab-stage-caption"><span>{percent === 0 ? '01 — TRAINING CAP' : percent === 100 ? '02 — OCTAGONAL CAP' : 'TRANSFORMATION'}<small>{percent === 0 ? '체육모 · 면 트윌' : percent === 100 ? '팔각모 · 디지털 위장 직물' : '형태와 직물이 이어지는 순간'}</small></span><span className="cap-lab-stage-progress">{String(percent).padStart(3, '0')}<small>%</small></span></div>
          </div>
          <div className="cap-lab-camera-bar"><span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 8.5V5a1 1 0 0 1 2 0v3-5a1 1 0 0 1 2 0v5-4a1 1 0 0 1 2 0v4-2a1 1 0 0 1 2 0v5l1-1a1.2 1.2 0 0 1 2 1l-3 5H7l-4-6a1.2 1.2 0 0 1 2-1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /></svg>드래그로 회전 · 스크롤 / 두 손가락으로 확대</span><button type="button" onClick={() => setCameraReset((value) => value + 1)}><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 8a6 6 0 1 1 .4 5M4 4v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>시점 초기화</button></div>
          <div className="cap-lab-size-strip"><div><span className="cap-lab-eyebrow">ACTUAL SIZE</span><p>작아도 명확하게.</p></div><div className="cap-lab-size-samples">{([40, 44, 48] as const).map((size) => <div className="cap-lab-size-sample" key={size} aria-label={`${size}px 버튼 미리보기`}><MorphingSendButton state={active ? 'running' : 'idle'} progress={animation.progress} onSend={() => direction(1)} onStop={() => direction(0)} reducedMotion={animation.reducedMotion} size={size} /><span>{size}<small>px</small></span></div>)}</div></div>
        </section>

        <aside className="cap-lab-controls" aria-labelledby="controls-title">
          <div className="cap-lab-controls-heading"><span className="cap-lab-eyebrow">02 / MOTION STUDY</span><h2 id="controls-title">움직임을 조율하세요</h2><p>한 프레임씩, 모든 각도에서.</p></div>
          <fieldset className="cap-lab-control-group"><legend>상태 전환</legend><div className="cap-lab-phase-grid">{(Object.keys(phaseLabels) as (keyof typeof phaseLabels)[]).map((phase, index) => <button key={phase} type="button" aria-pressed={animation.phase === phase} onClick={() => setPhase(phase)}><span>0{index + 1}</span><strong>{phase.toUpperCase()}</strong><small>{phaseLabels[phase]}</small></button>)}</div></fieldset>
          <div className="cap-lab-control-group"><div className="cap-lab-control-label"><label htmlFor="cap-progress">변형 진행도</label><output htmlFor="cap-progress">{percent}<span>%</span></output></div><input id="cap-progress" type="range" min="0" max="100" step="0.1" value={animation.progress * 100} onChange={(event) => animation.seek(Number(event.target.value) / 100)} style={{ '--cap-range-progress': `${percent}%` } as CSSProperties} /><div className="cap-lab-range-labels"><span>체육모</span><span>팔각모</span></div></div>
          <div className="cap-lab-direction-buttons"><button type="button" onClick={() => direction(1)}>체육모 <Arrow /> 팔각모</button><button type="button" onClick={() => direction(0)}>팔각모 <Arrow /> 체육모</button></div>
          <div className="cap-lab-playback"><button className="cap-lab-play-button" type="button" onClick={replay}>{animation.isPlaying ? <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h3v12H6zM12 4h3v12h-3z" fill="currentColor" /></svg> : <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6Z" fill="currentColor" /></svg>}{animation.isPlaying ? '일시 정지' : '애니메이션 재생'}</button><label className="cap-lab-speed"><span className="cap-lab-sr-only">재생 속도</span><select value={animation.speed} onChange={(event) => animation.setSpeed(Number(event.target.value))}>{[0.25, 0.5, 1, 1.5, 2].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}</select></label></div>
          <label className="cap-lab-motion-toggle"><input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} /><span className="cap-lab-switch" /><span>움직임 최소화<small>{animation.reducedMotion ? '회전 없이 상태를 전환합니다' : '기기의 모션 설정을 함께 반영합니다'}</small></span></label>
          <div className="cap-lab-specs"><div><span>TRANSITION</span><strong>{Math.round(780 / animation.speed)} <small>ms</small></strong></div><div><span>RENDERING</span><strong>{webgl === false ? 'Fallback' : 'On demand'}</strong></div></div>
          {webgl === false && <p className="cap-lab-fallback-note" role="status">이 환경에서는 3D 렌더링을 사용할 수 없어 정적 대체 화면을 표시합니다. 전송·중단 기능은 사용할 수 있습니다.</p>}
        </aside>
      </div>

      <MockComposer />
      <section className="cap-lab-material-notes" aria-label="디자인 디테일"><div><span className="cap-lab-material-swatch is-red" /><div><h3>선명한 시작</h3><p>둥근 크라운, 곡선형 챙과<br />패널을 잇는 섬세한 봉제선.</p></div></div><div><span className="cap-lab-material-swatch is-field" /><div><h3>단단한 실행</h3><p>각을 살린 팔각형 상판과<br />올리브·카키의 디지털 위장.</p></div></div><div><span className="cap-lab-detail-symbol" aria-hidden="true">↗</span><div><h3>절제된 움직임</h3><p>필요한 순간에만 움직이고,<br />완료되면 고요히 돌아옵니다.</p></div></div></section>
      <footer className="cap-lab-footer"><span>ROKMC AI <span> / </span> FORM FOLLOWS MISSION.</span><p>참고 사진 기반 프로시저럴 모델 · 문양과 위장 패턴은 근사 표현</p></footer>
    </main>
  </div>;
}
