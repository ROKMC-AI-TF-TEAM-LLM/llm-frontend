import IconButton from '@/shared/components/IconButton'
import { StarIcon } from '@/shared/components/icons'

export function FavStar({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <IconButton label={active ? '즐겨찾기 해제' : '즐겨찾기 추가'} onClick={onToggle} active={active}>
      <StarIcon className="h-[17px] w-[17px]" fill={active ? 'currentColor' : 'none'} strokeWidth={1.9} />
    </IconButton>
  )
}
