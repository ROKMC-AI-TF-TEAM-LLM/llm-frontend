import { useEffect, useState, useSyncExternalStore } from 'react';
import type { CapMorphAnimationOptions, CapMorphPhase, CapMorphTarget } from '../types';

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const validSpeed = (value: number) => Math.min(4, Math.max(0.1, Number.isFinite(value) ? value : 1));
const now = () => performance.now();
const isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
const motionQuery = '(prefers-reduced-motion: reduce)';

function subscribeToMotionPreference(listener: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

const getMotionPreference = () => typeof window !== 'undefined' && window.matchMedia(motionQuery).matches;
const getServerMotionPreference = () => false;

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, getServerMotionPreference);
}

interface AnimationSnapshot {
  progress: number;
  phase: CapMorphPhase;
  isPlaying: boolean;
  target: CapMorphTarget;
  speed: number;
}

interface Transition {
  from: number;
  to: CapMorphTarget;
  start: number;
  duration: number;
}

function phaseFor(progress: number, target: CapMorphTarget): CapMorphPhase {
  if (progress <= 0) return 'idle';
  if (progress >= 1) return 'running';
  return target === 1 ? 'transforming' : 'returning';
}

/** One bounded RAF per active transition; the external store also avoids stale React closures. */
function createAnimationController(options: CapMorphAnimationOptions) {
  const initialProgress = clamp(options.initialProgress ?? 0);
  let snapshot: AnimationSnapshot = {
    progress: initialProgress,
    target: options.target ?? (initialProgress === 1 ? 1 : 0),
    phase: phaseFor(initialProgress, options.target ?? 0),
    isPlaying: false,
    speed: validSpeed(options.speed ?? 1),
  };
  let durationMs = Math.max(1, options.durationMs ?? 780);
  let reducedMotion = Boolean(options.reducedMotion);
  let enabled = options.enabled ?? true;
  let transition: Transition | null = null;
  let frame: number | null = null;
  let resumeOnVisible = false;
  const listeners = new Set<() => void>();

  const publish = (patch: Partial<AnimationSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach(listener => listener());
  };

  const cancelFrame = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };

  const currentProgress = (time: number) => {
    if (!transition) return snapshot.progress;
    const fraction = clamp((time - transition.start) / transition.duration);
    // Quintic smoothstep keeps the settled frames still, without overshoot.
    const eased = fraction * fraction * fraction * (fraction * (fraction * 6 - 15) + 10);
    return transition.from + (transition.to - transition.from) * eased;
  };

  const tick = (time: number) => {
    frame = null;
    if (!transition || !enabled || isHidden()) return;
    const progress = currentProgress(time);
    const done = time - transition.start >= transition.duration;
    if (done) {
      const target = transition.to;
      transition = null;
      publish({ progress: target, target, phase: phaseFor(target, target), isPlaying: false });
      return;
    }
    publish({ progress, phase: phaseFor(progress, transition.to), isPlaying: true });
    frame = requestAnimationFrame(tick);
  };

  const playTo = (target: CapMorphTarget) => {
    const time = now();
    // Sample the outgoing transition before replacing it: reversal never resets the mesh.
    const progress = currentProgress(time);
    cancelFrame();
    transition = null;
    resumeOnVisible = false;
    if (reducedMotion || Math.abs(target - progress) < 0.0001) {
      publish({ progress: target, target, phase: phaseFor(target, target), isPlaying: false });
      return;
    }
    publish({ progress, target, phase: target === 1 ? 'transforming' : 'returning', isPlaying: enabled && !isHidden() });
    if (!enabled) return;
    if (isHidden()) {
      resumeOnVisible = true;
      return;
    }
    transition = {
      from: progress,
      to: target,
      start: time,
      duration: durationMs * Math.abs(target - progress) / snapshot.speed,
    };
    frame = requestAnimationFrame(tick);
  };

  const pause = () => {
    const progress = currentProgress(now());
    cancelFrame();
    transition = null;
    resumeOnVisible = false;
    publish({ progress, phase: phaseFor(progress, snapshot.target), isPlaying: false });
  };

  const resume = () => playTo(snapshot.target);

  const seek = (value: number) => {
    cancelFrame();
    transition = null;
    resumeOnVisible = false;
    const progress = clamp(value);
    // An endpoint is a settled business-facing state; intermediate scrubbing retains direction.
    const target = progress === 0 || progress === 1 ? progress : snapshot.target;
    publish({ progress, target, phase: phaseFor(progress, target), isPlaying: false });
  };

  const setSpeed = (value: number) => {
    const wasPlaying = snapshot.isPlaying;
    const progress = currentProgress(now());
    cancelFrame();
    transition = null;
    publish({ progress, speed: validSpeed(value), isPlaying: false });
    if (wasPlaying) resume();
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getSnapshot: () => snapshot,
    playTo,
    pause,
    resume,
    seek,
    setSpeed,
    reset: () => {
      pause();
      publish({ progress: 0, target: 0, phase: 'idle' });
    },
    configure: (next: { durationMs: number; reducedMotion: boolean; enabled: boolean }) => {
      durationMs = Math.max(1, next.durationMs);
      reducedMotion = next.reducedMotion;
      const wasEnabled = enabled;
      enabled = next.enabled;
      if (!enabled && wasEnabled) pause();
      if (reducedMotion && (transition || resumeOnVisible)) playTo(snapshot.target);
    },
    handleVisibility: () => {
      if (isHidden()) {
        const shouldResume = snapshot.isPlaying;
        pause();
        resumeOnVisible = shouldResume;
      } else if (resumeOnVisible) {
        resumeOnVisible = false;
        resume();
      }
    },
    dispose: () => {
      cancelFrame();
      transition = null;
      resumeOnVisible = false;
    },
  };
}

export function useCapMorphAnimation(options: CapMorphAnimationOptions = {}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const reducedMotion = prefersReducedMotion || Boolean(options.reducedMotion);
  const [controller] = useState(() => createAnimationController(options));
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const { durationMs = 780, enabled = true, target, speed } = options;

  useEffect(() => {
    controller.configure({ durationMs, reducedMotion, enabled });
  }, [controller, durationMs, reducedMotion, enabled]);

  useEffect(() => {
    if (target !== undefined && enabled) controller.playTo(target);
  }, [controller, target, enabled]);

  useEffect(() => {
    if (speed !== undefined) controller.setSpeed(speed);
  }, [controller, speed]);

  useEffect(() => {
    document.addEventListener('visibilitychange', controller.handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', controller.handleVisibility);
      controller.dispose();
    };
  }, [controller]);

  return {
    ...snapshot,
    reducedMotion,
    playTo: controller.playTo,
    pause: controller.pause,
    resume: controller.resume,
    seek: controller.seek,
    setSpeed: controller.setSpeed,
    reset: controller.reset,
  };
}
