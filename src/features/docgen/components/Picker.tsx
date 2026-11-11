import { useRef, useState, type ReactNode } from 'react'
import type { DocGenOutputFormat } from '../types'
import { OUTPUT_FORMATS } from '../utils'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { type Composer } from '../hooks'
import DomainIcon from '@/features/domains/components/DomainIcon'
import { CheckIcon, DocumentIcon } from '@/shared/components/icons'
import SelectButton from '@/shared/components/SelectButton'
import MenuItem from '@/shared/components/MenuItem'

/* ───────── 입력창 선택 칩 ───────── */
interface PickerOption {
  value: string
  label: string
  hint?: string
}

export function Picker({
  label,
  value,
  options,
  onChange,
  disabled = false,
  icon,
}: {
  label: string
  value: string | null
  options: PickerOption[]
  onChange: (v: string) => void
  disabled?: boolean
  icon?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), {
    enabled: open,
    event: 'pointerdown',
  })
  useEscapeKey(() => setOpen(false), open)
  const current = options.find((o) => o.value === value)
  return (
    <div ref={ref} className="relative">
      <SelectButton
        open={open}
        active={!!current}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        {icon}
        {current?.label ?? label}
      </SelectButton>
      {open && (
        <ul
          role="menu"
          aria-label={label}
          className="absolute left-0 top-full z-20 mt-2 max-h-[320px] w-[260px] overflow-y-auto rounded-2xl border border-surface-border bg-surface p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.1)] max-sm:fixed max-sm:inset-x-4 max-sm:bottom-4 max-sm:top-auto max-sm:w-auto"
        >
          <li
            role="none"
            className="px-3 pb-1 pt-1.5 text-12 font-semibold text-text-muted"
          >
            {label}
          </li>
          {options.map((o) => {
            const on = o.value === value
            return (
              <li key={o.value} role="none">
                <MenuItem
                  selected={on}
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-14 font-semibold ${on ? 'text-brand' : 'text-text-primary'}`}
                    >
                      {o.label}
                    </span>
                    {o.hint && (
                      <span className="mt-0.5 block text-12 leading-snug text-text-muted">
                        {o.hint}
                      </span>
                    )}
                  </span>
                  {on && (
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  )}
                </MenuItem>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** 분야·파일 유형(·양식) 선택 칩 묶음 */
export function ComposerOptions({
  c,
  disabled = false,
  withTemplate = false,
}: {
  c: Composer
  disabled?: boolean
  withTemplate?: boolean
}) {
  return (
    <>
      <Picker
        label="분야"
        value={c.domain}
        disabled={disabled}
        onChange={c.setDomain}
        icon={c.domain ? <DomainIcon code={c.domain} size={14} /> : undefined}
        options={[
          { value: '', label: '전체 분야' },
          ...c.domains.map((d) => ({ value: d.code, label: d.label })),
        ]}
      />
      <Picker
        label="파일 유형"
        value={c.format}
        disabled={disabled}
        onChange={(v) => c.setFormat(v as DocGenOutputFormat)}
        options={OUTPUT_FORMATS.map((f) => ({ value: f.code, label: f.label }))}
      />
      {withTemplate && (
        <Picker
          label="양식"
          value={c.templateId}
          disabled={disabled}
          icon={<DocumentIcon className="h-3.5 w-3.5" />}
          onChange={c.pickTemplate}
          options={c.templates.map((t) => ({
            value: t.template_id,
            label: t.name,
            hint: t.description,
          }))}
        />
      )}
    </>
  )
}
