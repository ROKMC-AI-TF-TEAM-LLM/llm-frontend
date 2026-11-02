// TEMP(시안 비교용) v9~v11 공용 훅·계산. 시안이 정해지면 drafts 폴더째 삭제
// v7의 움직임 도구를 그대로 옮겨 오고, 서버가 남은 시간을 주지 않는 경우를 위한 어림 계산을 더했다.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { DocGenJob } from '../../../types/docgen'
import { normalizeJobStatus } from '../../../utils/docgen'

/** 전환 곡선: 빠르게 출발해 길게 내려앉는다 */
export const EASE = 'cubic-bezier(.32,.72,0,1)'
export const EASE_DRAW = 'cubic-bezier(.76,0,.24,1)'
/** 돋아나는 버튼: 살짝 넘쳤다 돌아온다 */
export const SPRING = 'cubic-bezier(.34,1.56,.64,1)'

/** 넓은 화면이면 미리보기를 오른쪽 열에 띄운다 */
const WIDE = '(min-width: 1024px)'
const readViewport = () => ({ wide: window.matchMedia(WIDE).matches, h: window.innerHeight })

export const easeOut = (t: number) => 1 - (1 - t) ** 3
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

export const box = (x: number, y: number, w: number, h: number): CSSProperties => ({ transform: `translate(${x}px, ${y}px)`, width: w, height: h })

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 예약한 타이머를 한 번에 지운다 (화면을 떠나거나 다시 시작할 때) */
export function useTimers() {
  const ids = useRef<number[]>([])
  const frames = useRef<number[]>([])
  const later = useCallback((ms: number, fn: () => void) => { ids.current.push(window.setTimeout(fn, ms)) }, [])
  const frame = useCallback((fn: FrameRequestCallback) => { frames.current.push(requestAnimationFrame(fn)) }, [])
  const clear = useCallback(() => {
    ids.current.forEach((id) => { clearTimeout(id); clearInterval(id) })
    frames.current.forEach((id) => cancelAnimationFrame(id))
    ids.current = []
    frames.current = []
  }, [])
  useEffect(() => clear, [clear])
  return { later, frame, clear }
}

export function useViewport() {
  const [vp, setVp] = useState(readViewport)
  useEffect(() => {
    const on = () => setVp(readViewport())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

/** 숫자가 바뀌면 바로 바꾸지 않고 굴러 올라가게 한다 */
export function useTween(target: number, ms = 600) {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)
  useEffect(() => {
    const from = shownRef.current
    const dur = prefersReducedMotion() ? 0 : ms
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1
      shownRef.current = from + (target - from) * easeOut(t)
      setShown(Math.round(shownRef.current))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return shown
}

/** 켜져 있는 동안 1초마다 지금 시각을 돌려준다 (경과 시간 표시용) */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

const startOf = (job: DocGenJob) => Date.parse(job.started_at ?? job.created_at)

/** 시작부터 지금까지 (m:ss) */
export const formatElapsed = (job: DocGenJob, now: number): string => {
  const sec = Math.max(0, Math.round((now - startOf(job)) / 1000))
  if (Number.isNaN(sec)) return ''
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

/**
 * 남은 시간 어림. 서버는 진행률(%)만 주므로 지금까지의 속도로 계산한다.
 * 초반(10% 미만)에는 크게 틀리므로 보여 주지 않는다.
 */
export const estimateLeft = (job: DocGenJob, now: number): string | null => {
  if (normalizeJobStatus(job.status) !== 'running' || job.progress < 10 || job.progress >= 100) return null
  const elapsed = (now - startOf(job)) / 1000
  if (!(elapsed > 0)) return null
  const left = (elapsed * (100 - job.progress)) / job.progress
  if (left < 10) return '곧 끝납니다'
  return left < 60 ? `약 ${Math.round(left / 5) * 5}초 남음` : `약 ${Math.round(left / 60)}분 남음`
}

/** 펼쳐진 칸 안의 한 덩어리가 흐림에서 또렷해지며 차례로 떠오르게 한다 */
export const reveal = (open: boolean, animate: boolean, delay: number): CSSProperties => {
  const d = open ? delay : 0
  return {
    opacity: open ? 1 : 0,
    transform: open ? 'none' : 'translateY(16px)',
    filter: open ? 'none' : 'blur(6px)',
    transition: animate ? `opacity 500ms ${EASE} ${d}ms, transform 700ms ${EASE} ${d}ms, filter 600ms ${EASE} ${d}ms` : 'none',
  }
}

/** 처음 열 때 덩어리마다 차례로 떠오른다 (DraftV7.css의 v7-rise) */
export const rise = (d: number) => ({ className: 'v7-rise', style: { '--d': `${d}ms` } as CSSProperties })

/** 로프 무늬: 비스듬한 가는 줄을 겹쳐 꼬인 밧줄처럼 보이게 한다 */
export const ROPE_TEXTURE = 'repeating-linear-gradient(-60deg, rgb(255 255 255 / .5) 0 2px, transparent 2px 5px)'
export const ROPE_TEXTURE_TRACK = 'repeating-linear-gradient(-60deg, rgb(0 0 0 / .06) 0 2px, transparent 2px 5px)'
