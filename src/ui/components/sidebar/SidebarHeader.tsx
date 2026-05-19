import { useNavigate } from 'react-router-dom'

interface SidebarHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidebarHeader({ isOpen, onToggle }: SidebarHeaderProps) {
  const navigate = useNavigate()
  return (
    <div
      className={`flex items-center h-16 transition-all duration-300 ${
        isOpen ? "justify-between px-6" : "justify-center px-0"
      }`}
    >
      <h1
        className={`text-brand font-bold text-lg tracking-wide transition-opacity duration-200 cursor-pointer ${
          isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        }`}
        onClick={() => navigate('/chat')}
      >
        ROKMCLLM
      </h1>
      <button
        onClick={onToggle}
        className="text-text-secondary hover:text-text-primary transition-colors shrink-0 p-1"
        aria-label="사이드바 토글"
      >
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            isOpen ? "rotate-0" : "rotate-180"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}