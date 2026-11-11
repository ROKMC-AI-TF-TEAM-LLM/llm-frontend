import { useEffect, useRef, useState } from 'react'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useDomainCapabilities } from '@/features/documents/hooks'
import { type DomainSelection } from '../store/types'
import DomainIcon from '@/features/domains/components/DomainIcon'
import { CheckIcon, MenuIcon } from '@/shared/components/icons'
import MenuItem from '@/shared/components/MenuItem'
import SelectButton from '@/shared/components/SelectButton'

interface DomainPickerProps {
  value: DomainSelection | null
  onChange: (domain: DomainSelection | null) => void
}

export default function DomainPicker({ value, onChange }: DomainPickerProps) {
  const { domains, isLoading } = useDomainCapabilities()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null)

  const updatePos = () => {
    const btn = wrapRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    setPos({ left: r.left, bottom: window.innerHeight - r.top + 8 })
  }

  useEffect(() => {
    if (!open) return
    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open])

  useClickOutside([wrapRef, menuRef], () => setOpen(false), { enabled: open })

  if (isLoading) {
    return (
      <div
        className="h-10 w-[84px] rounded-full bg-surface-subtle animate-pulse"
        aria-hidden
      />
    )
  }

  if (domains.length === 0) return null

  const select = (domain: DomainSelection | null) => {
    onChange(domain)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <SelectButton
        open={open}
        active={!!value}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {value ? (
          <DomainIcon code={value.code} size={20} />
        ) : (
          <MenuIcon width={20} height={20} />
        )}
        <span>{value ? value.label : '전체'}</span>
      </SelectButton>

      {open && pos && (
        <div
          ref={menuRef}
          className="fixed min-w-[184px] rounded-2xl border border-surface-border shadow-[0_10px_30px_rgba(40,30,35,0.10)] p-1.5 z-50 animate-fade-in"
          style={{
            background: 'var(--color-surface)',
            left: pos.left,
            bottom: pos.bottom,
          }}
        >
          {domains.map((d) => {
            const active = value?.code === d.code
            return (
              <MenuRow
                key={d.code}
                active={active}
                onClick={() => select({ code: d.code, label: d.label })}
                icon={<DomainIcon code={d.code} size={14} />}
                label={d.label}
              />
            )
          })}

          <div className="my-1 h-px bg-surface-border mx-1.5" />
          <MenuRow
            active={!value}
            onClick={() => select(null)}
            icon={<MenuIcon width={14} height={14} strokeWidth={2.4} />}
            label="전체"
          />
        </div>
      )}
    </div>
  )
}

function MenuRow({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <MenuItem selected={active} onClick={onClick}>
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
          active
            ? 'bg-brand-soft text-brand'
            : 'bg-surface-subtle text-text-muted group-hover:bg-brand-subtle group-hover:text-brand'
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {active && <CheckIcon width={15} height={15} strokeWidth={2.6} />}
    </MenuItem>
  )
}
