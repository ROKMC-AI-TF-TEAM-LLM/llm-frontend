/** Document generation remains controlled by the consuming screen. */
export type CapMorphBusinessState = 'idle' | 'queued' | 'running' | 'completed' | 'failed';

export type CapMorphPhase = 'idle' | 'transforming' | 'running' | 'returning';
export type CapMorphTarget = 0 | 1;

export interface CapMorphAnimationOptions {
  initialProgress?: number;
  target?: CapMorphTarget;
  durationMs?: number;
  speed?: number;
  reducedMotion?: boolean;
  enabled?: boolean;
}

export interface MorphingSendButtonProps {
  state: CapMorphBusinessState;
  onSend: () => void;
  onStop: () => void;
  size?: 40 | 44 | 48;
  disabled?: boolean;
  className?: string;
  /** Optional scrubbed progress for an external animation controller. */
  progress?: number;
  reducedMotion?: boolean;
  durationMs?: number;
  'aria-label'?: string;
}
