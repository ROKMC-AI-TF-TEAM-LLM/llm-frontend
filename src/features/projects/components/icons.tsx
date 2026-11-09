
type IconProps = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const LayersIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M12 3l8 4.5-8 4.5-8-4.5z" />
    <path d="M4 12.5l8 4.5 8-4.5" />
    <path d="M4 17.5l8 4.5 8-4.5" />
  </svg>
)

export const SparkIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
    <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  </svg>
)

export const FileIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
)

export const ChatIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12z" />
  </svg>
)

export const PlusIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base} strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const SearchIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base} strokeWidth={2}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)

export const ChevronRight = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base} strokeWidth={2.2}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const ChevronDown = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base} strokeWidth={2.2}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const ArrowLeft = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base} strokeWidth={2.2}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
)

export const CloseIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base} strokeWidth={2.2}>
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export const MoreIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
)

export const StarIcon = ({ className = 'w-4 h-4', filled = false }: IconProps & { filled?: boolean }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2.6l2.9 6.1 6.6.7-4.9 4.5 1.3 6.4L12 17l-5.9 3.3 1.3-6.4L2.5 9.4l6.6-.7z" />
  </svg>
)

export const TrashIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M19 7l-.9 12.1A2 2 0 0 1 16.1 21H7.9a2 2 0 0 1-2-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
  </svg>
)

export const EditIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
)

export const NewChatIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M21 11.5a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 0 1 12 3.5" />
    <path d="M18 3.5v6M15 6.5h6" />
  </svg>
)

export const PanelIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base} strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
)

export const UploadIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
)
