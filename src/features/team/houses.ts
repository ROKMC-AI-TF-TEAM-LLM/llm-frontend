export type HouseKey = 'frontend' | 'backend' | 'pm' | 'corps'

export interface House {
  key: HouseKey
  label: string
  primary: string
  dark: string
  glow: string
}

export const HOUSES: Record<HouseKey, House> = {
  frontend: { key: 'frontend', label: '프론트엔드', primary: '#2fae8f', dark: '#0f4a3e', glow: 'rgba(47,174,143,.5)' },
  backend: { key: 'backend', label: '백엔드', primary: '#3b6fe0', dark: '#152a5c', glow: 'rgba(59,111,224,.5)' },
  pm: { key: 'pm', label: 'PM', primary: '#e0a52b', dark: '#5c4210', glow: 'rgba(224,165,43,.5)' },
  corps: { key: 'corps', label: '전우', primary: '#5c7a4a', dark: '#243318', glow: 'rgba(92,122,74,.5)' },
}

const ROLE_TO_HOUSE: Record<string, HouseKey> = {
  프론트엔드: 'frontend',
  백엔드: 'backend',
  PM: 'pm',
  전우: 'corps',
}

export const houseOf = (roles: string[]): House => {
  const key = roles.map((r) => ROLE_TO_HOUSE[r]).find(Boolean) ?? 'corps'
  return HOUSES[key]
}

export const HOUSE_EMBLEM: Record<HouseKey, string> = {
  frontend: 'M4 17c2-6 5-9 8-9s6 3 8 9M4 17h16M8 17v3M16 17v3',
  backend: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M4.5 4.5l2 2M17.5 17.5l2 2M2 12h3M19 12h3M4.5 19.5l2-2M17.5 6.5l2-2',
  pm: 'M12 2l1.5 7L21 12l-7.5 3L12 22l-1.5-7L3 12l7.5-3z',
  corps: 'M12 2l2.4 2.4M12 5v13M6 9H4a8 8 0 0 0 8 9 8 8 0 0 0 8-9h-2M8 9h8M9.6 4.6a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 0 0-4.8 0z',
}
