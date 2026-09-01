import type { ReactNode } from 'react'
import { isBlank } from '../isBlank'

export default function Placeholder({
  value,
  children,
  className = '',
}: {
  value: string
  children?: ReactNode
  className?: string
}) {
  if (!isBlank(value)) return <>{children ?? value}</>

  return (
    <span
      className={`inline-block rounded-md bg-brand-subtle px-2 py-0.5 text-brand/70 ring-1 ring-inset ring-brand-soft ${className}`}
      title="내용 채우기"
    >
      {value}
    </span>
  )
}
