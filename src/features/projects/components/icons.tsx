// 프로젝트 화면에서만 쓰는 아이콘. 범용 아이콘(닫기·별·삭제 등)은 @/shared/components/icons에 있다.
import { Icon, type IconProps } from '@/shared/components/icons'

const base = { className: 'w-4 h-4', strokeWidth: 1.9 }

export const LayersIcon = (props: IconProps) => (
  <Icon {...base} {...props}>
    <path d="M12 3l8 4.5-8 4.5-8-4.5z" />
    <path d="M4 12.5l8 4.5 8-4.5" />
    <path d="M4 17.5l8 4.5 8-4.5" />
  </Icon>
)

export const SparkIcon = (props: IconProps) => (
  <Icon {...base} {...props}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
    <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  </Icon>
)

export const NewChatIcon = (props: IconProps) => (
  <Icon {...base} {...props}>
    <path d="M21 11.5a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 0 1 12 3.5" />
    <path d="M18 3.5v6M15 6.5h6" />
  </Icon>
)

export const PanelIcon = (props: IconProps) => (
  <Icon {...base} strokeWidth={2} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </Icon>
)
