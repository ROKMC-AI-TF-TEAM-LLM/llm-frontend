import { DIRECTORY, type DirectoryEntry } from '@/features/team/directoryEntries'

export const BARKS = [
  '거수경례.',
  '충! 성!',
  '해병은 한계를 넘는다.',
  '뭘 봐, 클릭이나 해.',
  '귀신 잡던 그 기백.',
  '해병대 전우조는 죽어서도 유지된다.',
]

export const DISCHARGE_LINE = '전역'

export const PIXEL_FONT =
  '"Courier New", ui-monospace, "Cascadia Mono", "SF Mono", Consolas, monospace'

export const MAP_W = 1200
export const MAP_H = 800
export const WALK_SPEED = 190
export const PLAYER_R = 12

export type Wall = 'top' | 'left' | 'right'

export interface DoorPos extends DirectoryEntry {
  x: number
  y: number
  wall: Wall
}

export interface PropSpot {
  id: string
  x: number
  y: number
  label: string
  lines: string[]
}

export const PROP_SPOTS: PropSpot[] = [
  { id: 'aq-l', x: 102, y: 432, label: '수조', lines: ['관상어 두 마리가 유유히 돈다.', '먹이 주는 당번은... 오늘 누구였더라.'] },
  { id: 'aq-r', x: MAP_W - 102, y: 432, label: '수조', lines: ['수초 사이로 물방울이 올라온다.', '보고 있으면 마음이 좀 가라앉는다.'] },
  { id: 'fire-l', x: 116, y: 700, label: '벽난로', lines: ['장작이 탁, 탁 소리를 내며 탄다.', '손을 쬐면 딱 좋을 온도다.'] },
  { id: 'fire-r', x: MAP_W - 116, y: 700, label: '벽난로', lines: ['불씨가 은은하게 살아 있다.', '누군가 계속 장작을 갈아주는 모양이다.'] },
  { id: 'statue-1', x: MAP_W / 2 - 174, y: 196, label: '갑옷 진열대', lines: ['옛 군장이 먼지 하나 없이 서 있다.', '"한 번 해병은 영원한 해병."'] },
  { id: 'statue-2', x: MAP_W / 2 + 172, y: 196, label: '갑옷 진열대', lines: ['투구의 붉은 깃털이 곧게 서 있다.', '누가 매일 손질하는 게 분명하다.'] },
  { id: 'shelf-l', x: 84, y: 336, label: '서가', lines: ['규정집과 교범이 빼곡하다.', '표지가 닳은 걸 보니 다들 열심히 봤나 보다.'] },
  { id: 'shelf-r', x: MAP_W - 84, y: 336, label: '서가', lines: ['개발 서적 사이에 만화책이 한 권 섞여 있다.', '못 본 걸로 하자.'] },
  { id: 'medal', x: MAP_W / 2, y: MAP_H / 2 - 10, label: '명예의 메달', lines: ['닻 문장이 조명 아래 빛난다.', '"정의와 자유를 위하여"'] },
]

// 문을 맵 가장자리(상/좌/우 벽)에 배치. 하단 중앙은 입구 전용.
export const layoutDoors = (): DoorPos[] => {
  const n = DIRECTORY.length
  const topCount = Math.ceil(n * 0.45)
  const sideRemain = n - topCount
  const leftCount = Math.floor(sideRemain / 2)
  const rightCount = sideRemain - leftCount

  const topMargin = 150
  const topGap = topCount > 1 ? (MAP_W - topMargin * 2) / (topCount - 1) : 0
  const sideTop = 190
  const sideBottom = MAP_H - 260
  const leftGap = leftCount > 1 ? (sideBottom - sideTop) / (leftCount - 1) : 0
  const rightGap = rightCount > 1 ? (sideBottom - sideTop) / (rightCount - 1) : 0

  return DIRECTORY.map((r, i) => {
    if (i < topCount) {
      return { ...r, wall: 'top' as const, x: topMargin + i * topGap, y: 60 }
    }
    const j = i - topCount
    if (j < leftCount) {
      return { ...r, wall: 'left' as const, x: 60, y: sideTop + j * leftGap }
    }
    const k = j - leftCount
    return { ...r, wall: 'right' as const, x: MAP_W - 60, y: sideTop + k * rightGap }
  })
}
