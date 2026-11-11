import { LayersIcon } from './icons'

export function Mark({ size = 34, active = false }: { size?: number; active?: boolean }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.29),
        background: active ? 'var(--color-brand)' : 'var(--color-brand-subtle)',
        color: active ? '#fff' : 'var(--color-brand)',
        border: active ? 'none' : '1px solid #f7dfe4',
      }}
      className="inline-flex shrink-0 items-center justify-center"
    >
      <LayersIcon className="h-[45%] w-[45%]" />
    </span>
  )
}
