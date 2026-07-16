import { useEffect, useRef, useState } from 'react';
import { useDomainCapabilities } from '../../../hooks/useCapabilities';
import type { DomainSelection } from '../../../api/store/chatStore';
import DomainIcon from './DomainIcon';

interface DomainPickerProps {
  value: DomainSelection | null;   // null이면 '전체'
  onChange: (domain: DomainSelection | null) => void;
}

export default function DomainPicker({ value, onChange }: DomainPickerProps) {
  const { domains } = useDomainCapabilities();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // 드롭다운은 입력창 컨테이너의 overflow-hidden에 잘리므로, fixed로 뷰포트에 띄우고
  // 버튼 위치를 측정해 그 '바로 위'에 배치한다.
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);

  const updatePos = () => {
    const btn = wrapRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    // bottom: 버튼 위쪽까지의 거리(뷰포트 하단 기준) + 8px 간격
    setPos({ left: r.left, bottom: window.innerHeight - r.top + 8 });
  };

  // 열릴 때 위치 계산 + 스크롤/리사이즈 시 갱신
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

  // 바깥 클릭 시 닫기 (버튼·메뉴 둘 다 바깥일 때만)
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

  // 서버가 도메인을 안 주면(없거나 로딩 실패) 버튼 자체를 숨긴다 — 없는 도메인은 노출하지 않는다.
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
        className={`inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
          value
            ? 'bg-brand-subtle text-brand border-brand-soft'
            : 'bg-surface-subtle text-text-secondary border-surface-border hover:text-text-primary'
        }`}
      >
        {value ? <DomainIcon code={value.code} /> : (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        )}
        <span>{value ? value.label : '전체'}</span>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && pos && (
        <div
          ref={menuRef}
          className="fixed min-w-[168px] bg-surface rounded-2xl border border-surface-border shadow-[0_16px_40px_rgba(40,30,35,0.16)] py-1.5 z-50 animate-fade-in"
          style={{ background: '#fff', left: pos.left, bottom: pos.bottom }}
        >
          {domains.map((d) => {
            const active = value?.code === d.code;
            return (
              <button
                key={d.code}
                type="button"
                onClick={() => select({ code: d.code, label: d.label })}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] text-left transition-colors ${
                  active ? 'text-brand font-semibold' : 'text-text-secondary hover:bg-surface-subtle'
                }`}
              >
                <DomainIcon code={d.code} className="shrink-0" />
                <span className="flex-1">{d.label}</span>
                {active && (
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}

          {/* 구분선 + 전체 */}
          <div className="my-1 h-px bg-surface-border mx-2" />
          <button
            type="button"
            onClick={() => select(null)}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] text-left transition-colors ${
              !value ? 'text-brand font-semibold' : 'text-text-secondary hover:bg-surface-subtle'
            }`}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <span className="flex-1">전체</span>
            {!value && (
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
