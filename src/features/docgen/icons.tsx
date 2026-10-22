import type { ReactNode } from 'react'

/* 문서 생성 화면 아이콘 (인라인 stroke SVG) */
type IconProps = { className?: string }
function Svg({ className = 'h-4 w-4', children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}
export function DocIcon(p: IconProps) { return <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Svg> }
export function CheckIcon(p: IconProps) { return <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg> }
export function XIcon(p: IconProps) { return <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg> }
export function RetryIcon(p: IconProps) { return <Svg {...p}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 21v-5h5" /></Svg> }
export function DownloadIcon(p: IconProps) { return <Svg {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Svg> }
export function ChevronIcon(p: IconProps) { return <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg> }
export function StopIcon(p: IconProps) { return <Svg {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></Svg> }
export function ArrowUpIcon(p: IconProps) { return <Svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Svg> }
export function AlertIcon(p: IconProps) { return <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></Svg> }
