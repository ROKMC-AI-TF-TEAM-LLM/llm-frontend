import { useEffect, useRef, useState } from 'react';
import { useDomainCapabilities } from '../../../hooks/useCapabilities';
import type { DomainSelection } from '../../../api/store/chatStore';
import DomainIcon from './DomainIcon';

interface DomainPickerProps {
  value: DomainSelection | null;
  onChange: (domain: DomainSelection | null) => void;
}

export default function DomainPicker({ value, onChange }: DomainPickerProps) {
  const { domains, isLoading } = useDomainCapabilities();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);

  const updatePos = () => {
    const btn = wrapRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setPos({ left: r.left, bottom: window.innerHeight - r.top + 8 });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (isLoading) {
    return (
      <div className="h-10 w-[84px] rounded-full bg-surface-subtle animate-pulse" aria-hidden />
    );
  }

  if (domains.length === 0) return null;

  const select = (domain: DomainSelection | null) => {
    onChange(domain);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`group inline-flex items-center gap-1.5 pl-2 pr-2.5 h-10 rounded-full text-[13.5px] font-medium transition-colors duration-150 ${
          open || value
            ? 'bg-brand-subtle text-brand'
            : 'text-text-muted hover:bg-brand-subtle hover:text-brand'
        }`}
      >
        {value ? <DomainIcon code={value.code} size={20} /> : (
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        )}
        <span>{value ? value.label : '전체'}</span>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && pos && (
        <div
          ref={menuRef}
          className="fixed min-w-[184px] rounded-2xl border border-surface-border shadow-[0_10px_30px_rgba(40,30,35,0.10)] p-1.5 z-50 animate-fade-in"
          style={{ background: '#fff', left: pos.left, bottom: pos.bottom }}
        >
          {domains.map((d) => {
            const active = value?.code === d.code;
            return (
              <MenuRow
                key={d.code}
                active={active}
                onClick={() => select({ code: d.code, label: d.label })}
                icon={<DomainIcon code={d.code} size={14} />}
                label={d.label}
              />
            );
          })}

          <div className="my-1 h-px bg-surface-border mx-1.5" />
          <MenuRow
            active={!value}
            onClick={() => select(null)}
            icon={
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            }
            label="전체"
          />
        </div>
      )}
    </div>
  );
}

function MenuRow({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl text-[13.5px] text-left transition-colors ${
        active ? 'bg-brand-subtle text-brand font-semibold' : 'text-text-secondary hover:bg-surface-subtle'
      }`}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
          active ? 'bg-brand-soft text-brand' : 'bg-surface-subtle text-text-muted group-hover:bg-brand-subtle group-hover:text-brand'
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {active && (
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}
