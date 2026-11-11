// UI 아이콘 모음. 선으로 그린 24×24 아이콘이며 색은 글자색(currentColor)을 따른다.
//
//   <CloseIcon className="w-4 h-4" />            크기는 className 또는 width/height로
//   <CheckIcon width={14} height={14} strokeWidth={2.5} />   선 굵기 기본값은 2
//
// 새 아이콘은 여기에 추가한다. 일러스트·로고·차트처럼 아이콘이 아닌 그림은 쓰는 곳에 둔다.

import type { ReactNode, SVGProps } from 'react'

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>

/** 아이콘 공통 틀. 목록에 없는 모양을 그릴 때는 children으로 path를 넘긴다 */
export function Icon({
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/* ───────── 닫기·확인·더하기 ───────── */
export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Icon>
)
export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
)
export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

/* ───────── 화살표 ───────── */
export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
)
export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
)
export const ChevronsLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M17 6l-6 6 6 6" />
    <path d="M11 6l-6 6 6 6" />
  </Icon>
)
export const ArrowUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Icon>
)
export const ArrowDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Icon>
)
export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

/* ───────── 편집 동작 ───────── */
export const EditIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Icon>
)
export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19 7l-.9 12.1A2 2 0 0 1 16.1 21H7.9a2 2 0 0 1-2-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
  </Icon>
)
export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
)
export const RegenerateIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Icon>
)
export const RetryIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
    <path d="M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16" />
    <path d="M3 21v-5h5" />
  </Icon>
)
export const StarIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 2.6l2.9 6.1 6.6.7-4.9 4.5 1.3 6.4L12 17l-5.9 3.3 1.3-6.4L2.5 9.4l6.6-.7z" />
  </Icon>
)
/** 세로 점 세 개 (더보기). 선이 아니라 채운 점이다 */
export const MoreIcon = (props: IconProps) => (
  <Icon fill="currentColor" stroke="none" {...props}>
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </Icon>
)

/* ───────── 검색·메뉴 ───────── */
export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Icon>
)
export const MenuIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 7h18M3 12h18M3 17h18" />
  </Icon>
)

/* ───────── 파일·문서 ───────── */
export const FileIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </Icon>
)
export const DocumentIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M8 13h8M8 17h5" />
  </Icon>
)
export const FolderIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Icon>
)
export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </Icon>
)
export const UploadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Icon>
)

/* ───────── 대화·사용자 ───────── */
export const ChatIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
)
export const UserIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </Icon>
)
export const LogoutIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </Icon>
)
export const ExternalLinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
  </Icon>
)

/* ───────── 상태 ───────── */
export const InfoIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Icon>
)
export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </Icon>
)
export const StopIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </Icon>
)
/** 채운 네모 (생성 중단 버튼) */
export const StopFilledIcon = (props: IconProps) => (
  <Icon fill="currentColor" stroke="none" {...props}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </Icon>
)
/** 도는 고리. `animate-spin`과 함께 쓴다. trackOpacity는 바탕 고리의 진하기 */
export const SpinnerIcon = ({
  trackOpacity = 0.25,
  ...props
}: IconProps & { trackOpacity?: number }) => (
  <Icon strokeWidth={2.5} strokeLinejoin={undefined} {...props}>
    <circle
      cx="12"
      cy="12"
      r="9"
      strokeOpacity={trackOpacity}
      strokeLinecap={undefined}
    />
    <path d="M21 12a9 9 0 0 0-9-9" />
  </Icon>
)
