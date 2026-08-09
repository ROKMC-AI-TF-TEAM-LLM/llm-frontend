import { useNavigate } from "react-router";
import { useRef, useState } from "react";

interface SidebarHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidebarHeader({ isOpen, onToggle }: SidebarHeaderProps) {
  const navigate = useNavigate();
  const [showTip, setShowTip] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTip = () => {
    if (tipTimer.current) { clearTimeout(tipTimer.current); tipTimer.current = null; }
  };
  const onEnter = () => { clearTip(); tipTimer.current = setTimeout(() => setShowTip(true), 450); };
  const onLeave = () => { clearTip(); setShowTip(false); };
  const onClick = () => { clearTip(); setShowTip(false); onToggle(); };

  return (
    <div
      style={{ height: '60px' }}
      className={`flex-none flex items-center justify-between transition-[padding] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'px-[20px]' : 'px-[13px]'}`}
    >
      <div
        onClick={() => navigate("/chat")}
        className={`flex items-center cursor-pointer overflow-hidden transition-[opacity,max-width] duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'}`}
      >
        <span
          style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.06em', color: '#e4002b', whiteSpace: 'nowrap' }}
        >
          MARS
        </span>
      </div>

      <button
        onClick={onClick}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0 }}
        className="relative flex items-center justify-center border-none bg-transparent text-[#9a8a90] hover:bg-[#fdedf2] hover:text-[#c0002a] transition-colors cursor-pointer"
        aria-label={isOpen ? '사이드바 접기' : '사이드바 펴기'}
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? '' : 'rotate-180'}`}
        >
          <path d="M17 6l-6 6 6 6" />
          <path d="M11 6l-6 6 6 6" />
        </svg>
        {showTip && (
          <span
            className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-white bg-[#2c2b30] shadow-lg animate-fade-in"
          >
            {isOpen ? '사이드바 접기' : '사이드바 펴기'}
          </span>
        )}
      </button>
    </div>
  );
}
