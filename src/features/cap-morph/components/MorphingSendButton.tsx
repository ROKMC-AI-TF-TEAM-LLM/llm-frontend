import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useCapMorphAnimation } from '../hooks/useCapMorphAnimation';
import type { CapMorphBusinessState, MorphingSendButtonProps } from '../types';
import '../styles/button.css';

const loadScene = () => import('./MarineCapScene');
const LazyMarineCapScene = lazy(loadScene);

class SceneBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

type PendingAction = { kind: 'send' | 'stop'; from: CapMorphBusinessState };

/** Visual transitions never delay dispatching a send or cancellation. */
export function MorphingSendButton({
  state,
  onSend,
  onStop,
  size = 44,
  disabled = false,
  className = '',
  progress: externalProgress,
  reducedMotion,
  durationMs = 780,
  'aria-label': customLabel,
}: MorphingSendButtonProps) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const actionLatch = useRef<'send' | 'stop' | null>(null);
  const [sceneAvailable, setSceneAvailable] = useState<boolean | null>(null);
  const [sceneRequested, setSceneRequested] = useState(false);
  // Discard acknowledged optimistic state so a later return to idle cannot revive it.
  if (pending && pending.from !== state) setPending(null);
  const pendingAction = pending?.from === state ? pending.kind : null;
  const active = state === 'queued' || state === 'running' || pendingAction === 'send';
  const animation = useCapMorphAnimation({
    target: active && pendingAction !== 'stop' ? 1 : 0,
    // The callback still dispatches immediately. A cold GPU must render its first
    // frame before the visual transition can consume its bounded duration.
    enabled: externalProgress === undefined && sceneAvailable !== null,
    reducedMotion,
    durationMs,
  });
  const progress = externalProgress === undefined
    ? animation.progress
    : Math.min(1, Math.max(0, Number.isFinite(externalProgress) ? externalProgress : 0));
  const showCap = active || progress > 0.001;
  // Retain a warmed scene across idle states: demand rendering schedules no idle
  // frames, and readiness can never refer to a previously unmounted canvas.
  if (showCap && !sceneRequested) setSceneRequested(true);
  const label = customLabel ?? (active ? '문서 생성 중단' : state === 'failed' ? '문서 생성 다시 시도' : '문서 생성 시작');

  useEffect(() => { actionLatch.current = null; }, [state]);

  const markUnavailable = useCallback(() => setSceneAvailable(false), []);
  const warmScene = () => { if (!disabled) setSceneRequested(true); };

  const handleClick = () => {
    if (disabled) return;
    // A second click may cancel an optimistic send before the parent has committed queued/running.
    const shouldStop = active || actionLatch.current === 'send';
    if (actionLatch.current === 'stop') return;
    const kind = shouldStop ? 'stop' : 'send';
    actionLatch.current = kind;
    setPending({ kind, from: state });
    try {
      if (shouldStop) {
        onStop();
        // A send can be canceled before its parent ever leaves idle. There is then
        // no future state acknowledgement to release the guard for the next send.
        if (state !== 'queued' && state !== 'running') {
          actionLatch.current = null;
          setPending(null);
        }
      } else onSend();
    } catch (error) {
      actionLatch.current = null;
      setPending(null);
      throw error;
    }
  };

  const style = {
    '--cap-button-size': `${size}px`,
    '--cap-progress': progress,
    '--cap-fallback-color': `rgb(${Math.round(205 - 128 * progress)} ${Math.round(34 + 53 * progress)} ${Math.round(50 + 19 * progress)})`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`cap-morph-button ${className}`.trim()}
      style={style}
      disabled={disabled}
      onClick={handleClick}
      onPointerEnter={warmScene}
      onPointerDown={warmScene}
      onFocus={warmScene}
      aria-label={label}
      title={label}
      data-state={state}
      data-action={active ? 'stop' : 'send'}
      data-phase={externalProgress === undefined ? animation.phase : progress === 0 ? 'idle' : progress === 1 ? 'running' : 'transforming'}
      data-scene={sceneAvailable && showCap ? 'ready' : 'fallback'}
      data-reduced-motion={animation.reducedMotion ? 'true' : 'false'}
    >
      <span className="cap-morph-button__surface" aria-hidden="true" />
      {sceneRequested && (
        <span className="cap-morph-button__scene" aria-hidden="true">
          <SceneBoundary onUnavailable={markUnavailable}>
            <Suspense fallback={null}>
              <LazyMarineCapScene
                progress={progress}
                compact
                reducedMotion={animation.reducedMotion}
                onAvailabilityChange={setSceneAvailable}
              />
            </Suspense>
          </SceneBoundary>
        </span>
      )}
      <span className="cap-morph-button__symbol" aria-hidden="true">
        {active ? (
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </span>
    </button>
  );
}

export default MorphingSendButton;
