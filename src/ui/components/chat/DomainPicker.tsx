import { useEffect, useRef, useState } from 'react';
import { useDomainCapabilities } from '../../../hooks/useCapabilities';
import type { DomainSelection } from '../../../api/store/chatStore';
import DomainIcon from './DomainIcon';

interface DomainPickerProps {
  value: DomainSelection | null;   // null이면 '전체'
  onChange: (domain: DomainSelection | null) => void;
}

export default function DomainPicker({ value, onChange }: DomainPickerProps) {
  const { domains, isLoading } = useDomainCapabilities();
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

  // 로딩 중엔 스켈레톤으로 자리를 채워, 목록이 나중에 채워질 때 깜빡이지 않게 한다.
  if (isLoading) {
    return (
      <div className="h-10 w-[84px] rounded-full bg-surface-subtle animate-pulse" aria-hidden />
    );
  }

  // 로딩이 끝났는데도 도메인이 하나도 없으면(문서에 존재하는 도메인 없음) 버튼을 숨긴다.
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

          {/* 구분선 + 전체 */}
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

// 드롭다운 한 줄: 아이콘 배지 + 라벨 + (선택 시)체크. 활성 항목은 brand-subtle 배경으로 강조.
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
