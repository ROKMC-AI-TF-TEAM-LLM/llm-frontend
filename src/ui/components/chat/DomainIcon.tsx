// 도메인 코드별 아이콘. 코드가 목록에 없어도 기본(문서) 아이콘으로 떨어진다.
const pathFor = (code: string) => {
  switch (code) {
    case 'HR': // 인사 — 사람
      return <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />;
    case 'TECH': // 기술 — 톱니
      return <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />;
    case 'FINANCE_LEGAL': // 재정법무 — 저울
      return <path d="M12 3v18M5 21h14M6 7h12M6 7l-3 6a3 3 0 006 0L6 7zm12 0l-3 6a3 3 0 006 0l-3-6z" />;
    case 'MANUAL': // 교범 — 책
      return <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM19 3v18" />;
    case 'DIRECTIVE': // 훈령 — 깃발
      return <path d="M4 21V4m0 0h11l-1.5 4L15 12H4" />;
    default: // 기본 — 문서
      return <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6" />;
  }
};

interface DomainIconProps {
  code: string;
  size?: number;
  className?: string;
}

export default function DomainIcon({ code, size = 16, className }: DomainIconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {pathFor(code)}
    </svg>
  );
}
