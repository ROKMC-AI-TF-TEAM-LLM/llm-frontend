// 분야 색으로 칠하는 표시들. 분야 색(getDomainStyle)은 실행 중에 정해지므로 인라인 style은 여기에만 둔다.
import { DocumentIcon } from '@/shared/components/icons'
import { getDomainLabel, getDomainStyle } from '../utils'
import DomainIcon from './DomainIcon'

type Domain = string | null | undefined

const DOC_ICON_SIZE = {
  sm: { box: 38, radius: 10, icon: 18 },
  md: { box: 40, radius: 11, icon: 19 },
  lg: { box: 48, radius: 13, icon: 22 },
}

/** 분야 색 바탕의 네모 문서 아이콘 (출처·문서 목록·문서 상세) */
export function DomainDocIcon({
  domain,
  size = 'md',
}: {
  domain: Domain
  size?: keyof typeof DOC_ICON_SIZE
}) {
  const style = getDomainStyle(domain)
  const { box, radius, icon } = DOC_ICON_SIZE[size]
  return (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{
        width: box,
        height: box,
        borderRadius: radius,
        background: style.badgeBg,
        color: style.bar,
      }}
    >
      <DocumentIcon width={icon} height={icon} />
    </div>
  )
}

/** 분야 이름 알약 배지 */
export function DomainBadge({
  domain,
  size = 'sm',
}: {
  domain: string
  size?: 'sm' | 'md'
}) {
  const style = getDomainStyle(domain)
  return (
    <span
      className={`font-semibold rounded-full ${size === 'sm' ? 'shrink-0 text-11 px-2 py-0.5' : 'inline-block text-12 px-3 py-1'}`}
      style={{ background: style.badgeBg, color: style.badgeText }}
    >
      {getDomainLabel(domain)}
    </span>
  )
}

/** 분야 색 글자: 아이콘 + 분야 이름 */
export function DomainText({
  domain,
  iconSize,
  className = '',
}: {
  domain: string
  iconSize: number
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ color: getDomainStyle(domain).badgeText }}
    >
      <DomainIcon code={domain} size={iconSize} />
      {getDomainLabel(domain)}
    </span>
  )
}

/** 분야 색 막대·점. 모양(크기)은 className으로 준다 */
export function DomainBar({
  domain,
  className,
}: {
  domain: Domain
  className: string
}) {
  return (
    <span
      className={`rounded-full ${className}`}
      style={{ background: getDomainStyle(domain).bar }}
      aria-hidden
    />
  )
}
