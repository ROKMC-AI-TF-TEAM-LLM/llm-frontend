import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { DIRECTORY, type DirectoryEntry } from '../features/team/directoryEntries'
import { houseOf, HOUSES, HOUSE_EMBLEM } from '../features/team/houses'

const BARKS = [
  '거수경례.',
  '충! 성!',
  '해병은 한계를 넘는다.',
  '뭘 봐, 클릭이나 해.',
  '귀신 잡던 그 기백.',
  '해병대 전우조는 죽어서도 유지된다.',
]

const DISCHARGE_LINE = '전역'

const PIXEL_FONT =
  '"Courier New", ui-monospace, "Cascadia Mono", "SF Mono", Consolas, monospace'

const MAP_W = 1200
const MAP_H = 800
const WALK_SPEED = 190
const PLAYER_R = 12

type Wall = 'top' | 'left' | 'right'

interface DoorPos extends DirectoryEntry {
  x: number
  y: number
  wall: Wall
}

// 탑뷰 캐릭터: 전투복 + 팔각모 + 빨간 명찰 + 걷는 다리
function TopDownGuy({
  tint,
  outline = '#0a0d08',
  legPhase = 0,
}: {
  tint: string
  outline?: string
  legPhase?: 0 | 1
}) {
  const legSpread = legPhase === 0 ? 2 : -2
  return (
    <svg width="28" height="34" viewBox="0 0 28 34" shapeRendering="crispEdges">
      <ellipse cx="14" cy="31" rx="9" ry="2.6" fill="rgba(0,0,0,.35)" />
      <rect x={11 - legSpread} y="20" width="4" height="10" fill="#2c3324" stroke={outline} strokeWidth={1} />
      <rect x={13 + legSpread} y="20" width="4" height="10" fill="#2c3324" stroke={outline} strokeWidth={1} />
      <rect x={10.5 - legSpread} y="27" width="5" height="3.5" fill="#171a12" stroke={outline} strokeWidth={0.8} />
      <rect x={12.5 + legSpread} y="27" width="5" height="3.5" fill="#171a12" stroke={outline} strokeWidth={0.8} />
      <rect x="6" y="11" width="16" height="14" rx="2" fill="#4a5240" stroke={outline} strokeWidth={1.4} />
      <rect x="6" y="11" width="16" height="14" rx="2" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="1" strokeDasharray="2 2" />
      <rect x="4.5" y="11" width="3.5" height="7" fill={tint} stroke={outline} strokeWidth={1} />
      <rect x="20" y="11" width="3.5" height="7" fill={tint} stroke={outline} strokeWidth={1} />
      <rect x="6" y="21" width="16" height="2.4" fill="#3a2a1e" stroke={outline} strokeWidth={0.6} />
      <rect x="15.5" y="14" width="5.5" height="2.6" fill="#e4002b" stroke="#5c0714" strokeWidth={0.6} />
      <polygon
        points="14,3.2 18,4.6 20.2,8 18,11.4 14,12.8 10,11.4 7.8,8 10,4.6"
        fill="#3a4530"
        stroke={outline}
        strokeWidth={1.3}
      />
      <circle cx="14" cy="8.6" r="4.4" fill="#e4c9a8" />
      <path d="M9.6 7 A4.4 4.4 0 0 1 18.4 7" fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="1.4" />
    </svg>
  )
}

// 가구: 3인용 소파
function SofaProp({ facing = 'right' }: { facing?: 'left' | 'right' }) {
  const flip = facing === 'left' ? 'scaleX(-1)' : 'none'
  return (
    <svg width="96" height="52" viewBox="0 0 96 52" style={{ transform: flip }}>
      <defs>
        <linearGradient id="sofaBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9c2836" />
          <stop offset="100%" stopColor="#5c141e" />
        </linearGradient>
        <linearGradient id="sofaBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b83445" />
          <stop offset="100%" stopColor="#7a1c28" />
        </linearGradient>
      </defs>
      <ellipse cx="48" cy="47" rx="42" ry="6" fill="rgba(0,0,0,.34)" />
      <rect x="6" y="4" width="84" height="18" rx="6" fill="url(#sofaBack)" stroke="#2c0a10" strokeWidth="1.6" />
      <rect x="2" y="20" width="92" height="20" rx="5" fill="url(#sofaBody)" stroke="#2c0a10" strokeWidth="1.6" />
      <path d="M33 22v16M63 22v16" stroke="#3a0c14" strokeWidth="1.3" opacity="0.6" />
      <path d="M6 26h84" stroke="rgba(0,0,0,.22)" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M4 21h88 v5 a44 5 0 0 1 -88 0 Z" fill="rgba(0,0,0,.26)" />
      <rect x="0" y="10" width="12" height="30" rx="5" fill="url(#sofaBody)" stroke="#2c0a10" strokeWidth="1.6" />
      <rect x="84" y="10" width="12" height="30" rx="5" fill="url(#sofaBody)" stroke="#2c0a10" strokeWidth="1.6" />
      <rect x="2" y="12" width="8" height="4" rx="2" fill="rgba(255,255,255,.20)" />
      <rect x="86" y="12" width="8" height="4" rx="2" fill="rgba(255,255,255,.20)" />
      <rect x="8" y="40" width="4" height="8" fill="#3a2a1e" />
      <rect x="84" y="40" width="4" height="8" fill="#3a2a1e" />
      <path d="M10 8h76" stroke="rgba(255,255,255,.24)" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 39h88" stroke="rgba(0,0,0,.30)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

// 가구: 대형 화분(야자수)
function PalmProp() {
  return (
    <svg width="46" height="72" viewBox="0 0 46 72">
      <defs>
        <linearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5236" />
          <stop offset="100%" stopColor="#3a2818" />
        </linearGradient>
        <radialGradient id="leafGrad" cx="25%" cy="30%">
          <stop offset="0%" stopColor="#79b562" />
          <stop offset="100%" stopColor="#2f5228" />
        </radialGradient>
      </defs>
      <ellipse cx="23" cy="68" rx="17" ry="4.5" fill="rgba(0,0,0,.32)" />
      {[-70, -35, -5, 25, 55, 90].map((deg) => (
        <path
          key={deg}
          d="M23 40 C23 22 30 8 42 2 C34 14 32 28 25 40 Z"
          fill="url(#leafGrad)"
          stroke="#1f3a1a"
          strokeWidth="1"
          transform={`rotate(${deg} 23 40)`}
        />
      ))}
      <path d="M9 44 L37 44 L33 66 L13 66 Z" fill="url(#potGrad)" stroke="#2e2118" strokeWidth="1.6" />
      <rect x="9" y="42" width="28" height="6" rx="1.5" fill="#8a5a34" stroke="#2e2118" strokeWidth="1.4" />
      <path d="M13 66h20" stroke="#2e2118" strokeWidth="1.4" opacity="0.5" />
    </svg>
  )
}

// 가구: 책장
function ShelfProp() {
  return (
    <svg width="46" height="76" viewBox="0 0 46 76">
      <defs>
        <linearGradient id="shelfFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5c4030" />
          <stop offset="100%" stopColor="#2a1c12" />
        </linearGradient>
      </defs>
      <ellipse cx="23" cy="74" rx="19" ry="4" fill="rgba(0,0,0,.3)" />
      <rect x="1" y="1" width="44" height="72" rx="2" fill="url(#shelfFrame)" stroke="#2e2118" strokeWidth="2" />
      <rect x="2" y="2" width="4" height="70" fill="rgba(255,240,210,.13)" />
      <rect x="39" y="2" width="5" height="70" fill="rgba(0,0,0,.26)" />
      {[0, 1, 2, 3].map((row) => (
        <g key={row}>
          <rect x="4" y={5 + row * 17} width="38" height="14" fill="#160f0a" opacity="0.72" />
          <rect x="3" y={18 + row * 17} width="40" height="2.6" fill="#6b5238" />
          <rect x="3" y={20.2 + row * 17} width="40" height="1.2" fill="rgba(0,0,0,.4)" />
          {Array.from({ length: 7 }, (_, b) => {
            const colors = ['#8a2230', '#c9932e', '#2d6b9e', '#3f8a5c', '#6b4fa0', '#b0552a']
            const h = 10 + ((row * 7 + b) % 4)
            return (
              <rect
                key={b}
                x={5 + b * 5.3}
                y={5 + row * 17 + (14 - h)}
                width={4.2}
                height={h}
                fill={colors[(row + b) % colors.length]}
                stroke="rgba(0,0,0,.35)"
                strokeWidth="0.5"
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}

// 가구: 벽걸이 액자
function PlaqueProp({ accent, id }: { accent: string; id: string }) {
  const gradId = `plaqueGrad-${id}`
  return (
    <svg width="34" height="28" viewBox="0 0 34 28">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2e2118" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="34" height="28" fill="#2e2118" />
      <rect x="2.5" y="2.5" width="29" height="23" fill={`url(#${gradId})`} stroke="#6b4a2e" strokeWidth="1" />
      <path d="M5 20 L13 10 L18 16 L23 8 L29 20 Z" fill={accent} opacity="0.75" />
      <circle cx="24" cy="8" r="2.4" fill={accent} opacity="0.9" />
    </svg>
  )
}

// 가구: 어항
function AquariumProp({ id }: { id: string }) {
  const g = `aq-${id}`
  return (
    <svg width="86" height="66" viewBox="0 0 86 66">
      <defs>
        <linearGradient id={`${g}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fd8e8" />
          <stop offset="55%" stopColor="#2f8fb5" />
          <stop offset="100%" stopColor="#155273" />
        </linearGradient>
        <linearGradient id={`${g}-stand`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c4030" />
          <stop offset="100%" stopColor="#2a1c12" />
        </linearGradient>
      </defs>
      <ellipse cx="43" cy="62" rx="34" ry="5" fill="rgba(0,0,0,.32)" />
      <rect x="8" y="44" width="70" height="16" rx="2" fill={`url(#${g}-stand)`} stroke="#2e2118" strokeWidth="1.6" />
      <rect x="6" y="6" width="74" height="40" rx="3" fill={`url(#${g}-w)`} stroke="#2e2118" strokeWidth="2" />
      <rect x="8" y="40" width="70" height="6" fill="#c8a86a" opacity="0.9" />
      <path d="M20 42 q-4 -10 2 -18 q2 10 0 18Z" fill="#2f7a44" />
      <path d="M27 42 q3 -12 -2 -20 q-3 12 0 20Z" fill="#3f9a56" />
      <path d="M63 42 q4 -9 -1 -16 q-2 9 -1 16Z" fill="#2f7a44" />
      <g>
        <ellipse cx="42" cy="22" rx="7" ry="4.2" fill="#f0a63c" />
        <path d="M49 22 l6 -4 v8 Z" fill="#e08a24" />
        <circle cx="39" cy="21" r="1.1" fill="#2a1c12" />
      </g>
      <g opacity="0.85">
        <ellipse cx="60" cy="32" rx="5" ry="3" fill="#e8677a" />
        <path d="M65 32 l4.5 -3 v6 Z" fill="#c94f61" />
      </g>
      <path d="M10 12 h30" stroke="rgba(255,255,255,.45)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="6" y="6" width="74" height="40" rx="3" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
    </svg>
  )
}

// 가구: 원형 테이블 + 촛대
function TableProp() {
  return (
    <svg width="70" height="62" viewBox="0 0 70 62">
      <defs>
        <radialGradient id="tblTop" cx="38%" cy="30%">
          <stop offset="0%" stopColor="#a57546" />
          <stop offset="100%" stopColor="#5c3f28" />
        </radialGradient>
      </defs>
      <ellipse cx="35" cy="56" rx="26" ry="5" fill="rgba(0,0,0,.32)" />
      <rect x="31" y="32" width="8" height="22" fill="#4a3020" stroke="#2e2118" strokeWidth="1.4" />
      <ellipse cx="35" cy="54" rx="16" ry="5" fill="#4a3020" stroke="#2e2118" strokeWidth="1.4" />
      <ellipse cx="35" cy="30" rx="31" ry="13" fill={'url(#tblTop)'} stroke="#2e2118" strokeWidth="2" />
      <ellipse cx="35" cy="28" rx="24" ry="9" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1.4" />
      <rect x="33" y="14" width="4" height="12" fill="#c9a24a" />
      <ellipse cx="35" cy="26" rx="7" ry="2.6" fill="#a8802f" />
      <ellipse cx="35" cy="12" rx="2.6" ry="4" fill="#ffd97a" />
      <ellipse cx="35" cy="11" rx="1.2" ry="2.2" fill="#fff3c4" />
    </svg>
  )
}

// 가구: 갑옷 조각상
function StatueProp() {
  return (
    <svg width="46" height="82" viewBox="0 0 46 82">
      <defs>
        <linearGradient id="stnBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a7f6d" />
          <stop offset="100%" stopColor="#4a4034" />
        </linearGradient>
        <linearGradient id="stnBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b9c2c9" />
          <stop offset="60%" stopColor="#78848d" />
          <stop offset="100%" stopColor="#454f57" />
        </linearGradient>
      </defs>
      <ellipse cx="23" cy="78" rx="18" ry="4.5" fill="rgba(0,0,0,.34)" />
      <rect x="7" y="66" width="32" height="12" rx="2" fill={'url(#stnBase)'} stroke="#2e2118" strokeWidth="1.6" />
      <rect x="11" y="60" width="24" height="8" rx="2" fill={'url(#stnBase)'} stroke="#2e2118" strokeWidth="1.4" />
      <path d="M14 30 h18 l3 22 h-24 Z" fill={'url(#stnBody)'} stroke="#2a3238" strokeWidth="1.6" />
      <path d="M23 32 v20" stroke="rgba(0,0,0,.3)" strokeWidth="1.2" />
      <ellipse cx="13" cy="32" rx="6" ry="5" fill={'url(#stnBody)'} stroke="#2a3238" strokeWidth="1.4" />
      <ellipse cx="33" cy="32" rx="6" ry="5" fill={'url(#stnBody)'} stroke="#2a3238" strokeWidth="1.4" />
      <path d="M16 20 a7 8 0 0 1 14 0 v8 h-14 Z" fill={'url(#stnBody)'} stroke="#2a3238" strokeWidth="1.6" />
      <rect x="19" y="23" width="8" height="3" fill="#1d252b" />
      <path d="M23 12 q5 -6 3 -10 q-6 3 -3 10Z" fill="#c02a3c" />
      <rect x="10" y="52" width="26" height="4" fill="#3a444c" opacity="0.8" />
    </svg>
  )
}

// 가구: 벽난로
function FireplaceProp() {
  return (
    <svg width="92" height="72" viewBox="0 0 92 72">
      <defs>
        <linearGradient id="fpStone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7d7266" />
          <stop offset="100%" stopColor="#3c352c" />
        </linearGradient>
        <radialGradient id="fpFire" cx="50%" cy="80%">
          <stop offset="0%" stopColor="#fff0a8" />
          <stop offset="45%" stopColor="#f7a12a" />
          <stop offset="100%" stopColor="#c33d10" />
        </radialGradient>
      </defs>
      <ellipse cx="46" cy="68" rx="40" ry="5" fill="rgba(0,0,0,.3)" />
      <rect x="4" y="6" width="84" height="60" rx="3" fill={'url(#fpStone)'} stroke="#2b251e" strokeWidth="2" />
      {[0, 1, 2, 3].map((r) => (
        <path key={r} d={`M6 ${14 + r * 13} h80`} stroke="rgba(0,0,0,.28)" strokeWidth="1.2" />
      ))}
      <rect x="0" y="0" width="92" height="10" rx="2" fill="#5c4030" stroke="#2b251e" strokeWidth="1.6" />
      <path d="M24 62 v-22 a22 20 0 0 1 44 0 v22 Z" fill="#160d08" stroke="#2b251e" strokeWidth="1.6" />
      <rect x="32" y="55" width="28" height="5" rx="2" fill="#4a2f1a" />
      <rect x="36" y="50" width="20" height="5" rx="2" fill="#5c3a20" />
      <path
        d="M46 56 q-9 -8 -4 -17 q2 5 5 6 q-3 -9 4 -14 q-1 8 5 12 q4 4 3 9 q-1 5 -13 4Z"
        fill={'url(#fpFire)'}
        style={{ animation: 'hof-flame .9s ease-in-out infinite alternate', transformOrigin: '46px 56px' }}
      />
      <ellipse cx="46" cy="60" rx="20" ry="6" fill="rgba(255,160,60,.28)" />
    </svg>
  )
}

// 조명: 샹들리에
function ChandelierProp() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="chGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(255,226,150,.55)" />
          <stop offset="100%" stopColor="rgba(255,226,150,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="52" rx="62" ry="52" fill={'url(#chGlow)'} />
      <path d="M48 0 v16" stroke="#9c7a3a" strokeWidth="2.5" />
      <path d="M40 16 h16 l-4 8 h-8 Z" fill="#c9a24a" stroke="#6b4f1e" strokeWidth="1.4" />
      <ellipse cx="48" cy="44" rx="30" ry="11" fill="none" stroke="#c9a24a" strokeWidth="3.4" />
      <ellipse cx="48" cy="44" rx="30" ry="11" fill="none" stroke="rgba(255,240,200,.5)" strokeWidth="1.2" />
      <path d="M48 24 L20 44 M48 24 L76 44 M48 24 L48 44" stroke="#a8862f" strokeWidth="2" />
      {[
        [20, 44], [34, 50], [48, 52], [62, 50], [76, 44], [48, 36],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <rect x={cx - 2.5} y={cy - 12} width="5" height="12" fill="#efe2c4" />
          <ellipse
            cx={cx}
            cy={cy - 16}
            rx="3"
            ry="5"
            fill="#ffcf67"
            style={{ animation: `hof-flicker ${1.1 + i * 0.13}s ease-in-out infinite alternate` }}
          />
          <ellipse cx={cx} cy={cy - 17} rx="1.4" ry="2.6" fill="#fff6d8" />
        </g>
      ))}
      {[26, 38, 50, 62, 72].map((cx, i) => (
        <path key={i} d={`M${cx} 50 l3 6 l-3 6 l-3 -6 Z`} fill="rgba(255,240,200,.7)" />
      ))}
    </svg>
  )
}

// 접지 그림자
function Grounded({ w, h, offY = 0, children }: { w: number; h: number; offY?: number; children: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: h + offY,
          width: w,
          height: w * 0.26,
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(30,16,6,.46), rgba(30,16,6,.18) 55%, transparent 74%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  )
}

// 장식: 러그
function RugProp({ tone = '#3d6f8c' }: { tone?: string }) {
  return (
    <svg width="150" height="98" viewBox="0 0 150 98">
      <ellipse cx="75" cy="49" rx="73" ry="47" fill={tone} opacity="0.92" />
      <ellipse cx="75" cy="49" rx="73" ry="47" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="2.5" />
      <ellipse cx="75" cy="49" rx="60" ry="37" fill="none" stroke="rgba(255,255,255,.24)" strokeWidth="3" />
      <ellipse cx="75" cy="49" rx="44" ry="26" fill="rgba(255,255,255,.10)" />
      <ellipse cx="75" cy="49" rx="30" ry="17" fill="none" stroke="rgba(255,255,255,.20)" strokeWidth="2.4" />
      <ellipse cx="75" cy="49" rx="12" ry="7" fill="rgba(255,255,255,.16)" />
    </svg>
  )
}

interface PropSpot {
  id: string
  x: number
  y: number
  label: string
  lines: string[]
}

const PROP_SPOTS: PropSpot[] = [
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
const layoutDoors = (): DoorPos[] => {
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

export default function SystemDiagnostics() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [booting, setBooting] = useState(false)
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [authErr, setAuthErr] = useState(false)
  const [self, setSelf] = useState<DirectoryEntry | null>(null)

  const [doors] = useState<DoorPos[]>(() => layoutDoors())
  const [pos, setPos] = useState({ x: MAP_W / 2, y: MAP_H - 90 })
  const [walking, setWalking] = useState(false)
  const [legPhase, setLegPhase] = useState<0 | 1>(0)
  const [active, setActive] = useState<DoorPos | null>(null)
  const [openingDoor, setOpeningDoor] = useState<string | null>(null)
  const [bark, setBark] = useState(BARKS[0])
  const [showMap, setShowMap] = useState<DoorPos | null>(null)
  const [viewport, setViewport] = useState({ w: 960, h: 600 })
  const [propMsg, setPropMsg] = useState<PropSpot | null>(null)
  const fieldRef = useRef<HTMLDivElement>(null)

  const posRef = useRef(pos)
  const keysRef = useRef<Set<string>>(new Set())
  const legTimerRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)
  const nearbyRef = useRef<DoorPos | null>(null)
  const mapSignRef = useRef<DoorPos | null>(null)
  const nearPropRef = useRef<PropSpot | null>(null)

  useEffect(() => {
    document.title = 'MARS'
  }, [])

  useEffect(() => {
    if (!entered) return
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [entered])

  const enter = (e: FormEvent) => {
    e.preventDefault()
    const match = DIRECTORY.find((m) => m.cohort.replace(/\D/g, '') === id.trim() && m.name === pw.trim())
    if (!match) {
      setAuthErr(true)
      return
    }
    setAuthErr(false)
    setSelf(match)
    setBooting(true)
    window.setTimeout(() => {
      const self0 = doors.find((d) => d.cohort === match.cohort && d.name === match.name)
      if (self0) {
        const p = { x: self0.x, y: self0.y + 90 }
        posRef.current = p
        setPos(p)
      }
      setBooting(false)
      setEntered(true)
    }, 900)
  }

  const talkTo = (n: DoorPos) => {
    const key = `${n.cohort}-${n.name}`
    setOpeningDoor(key)
    window.setTimeout(() => {
      setActive(n)
      setBark(n.discharged ? DISCHARGE_LINE : BARKS[Math.floor(Math.random() * BARKS.length)])
      setOpeningDoor(null)
    }, 360)
  }

  useEffect(() => {
    if (!entered) return
    let last = performance.now()

    const clampXY = (x: number, y: number) => ({
      x: Math.max(PLAYER_R + 16, Math.min(MAP_W - PLAYER_R - 16, x)),
      y: Math.max(PLAYER_R + 16, Math.min(MAP_H - PLAYER_R - 16, y)),
    })

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const keys = keysRef.current
      let kx = 0
      let ky = 0
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) kx -= 1
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) kx += 1
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) ky -= 1
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) ky += 1

      let moved = false
      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky) || 1
        const nx = posRef.current.x + (kx / len) * WALK_SPEED * dt
        const ny = posRef.current.y + (ky / len) * WALK_SPEED * dt
        posRef.current = clampXY(nx, ny)
        moved = true
      }

      if (moved) {
        legTimerRef.current += dt
        if (legTimerRef.current > 0.18) {
          legTimerRef.current = 0
          setLegPhase((p) => (p === 0 ? 1 : 0))
        }
      }
      setWalking(moved)
      setPos({ ...posRef.current })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [entered])

  useEffect(() => {
    if (!entered) return
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (e.key === 'e' || e.key === 'E') {
        if (nearbyRef.current) talkTo(nearbyRef.current)
        else if (mapSignRef.current) setShowMap(mapSignRef.current)
        else if (nearPropRef.current) setPropMsg(nearPropRef.current)
      } else if (e.key === 'Escape') {
        setActive(null)
        setShowMap(null)
        setPropMsg(null)
      }
    }
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [entered])

  const NEAR_DIST = 46
  const nearby = doors
    .map((n) => ({ n, d: Math.hypot(n.x - pos.x, n.y - pos.y) }))
    .filter((v) => v.d <= NEAR_DIST)
    .sort((a, b) => a.d - b.d)[0]?.n ?? null

  const SIGN_DIST = 44
  const mapSign = !nearby
    ? doors
        .map((n) => ({ n, d: Math.hypot(n.x + 42 - pos.x, n.y - 10 - pos.y) }))
        .filter((v) => v.d <= SIGN_DIST)
        .sort((a, b) => a.d - b.d)[0]?.n ?? null
    : null

  const PROP_DIST = 54
  const nearProp =
    !nearby && !mapSign
      ? PROP_SPOTS.map((p) => ({ p, d: Math.hypot(p.x - pos.x, p.y - pos.y) }))
          .filter((v) => v.d <= PROP_DIST)
          .sort((a, b) => a.d - b.d)[0]?.p ?? null
      : null

  useEffect(() => {
    nearbyRef.current = nearby
    mapSignRef.current = mapSign
    nearPropRef.current = nearProp
  })

  const camX =
    MAP_W <= viewport.w
      ? (MAP_W - viewport.w) / 2
      : Math.max(0, Math.min(MAP_W - viewport.w, pos.x - viewport.w / 2))
  const camY =
    MAP_H <= viewport.h
      ? (MAP_H - viewport.h) / 2
      : Math.max(0, Math.min(MAP_H - viewport.h, pos.y - viewport.h / 2))

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#0a0d08',
        fontFamily: PIXEL_FONT,
        color: '#c9d4b8',
      }}
    >
      <style>{`
        @keyframes hof-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes hof-scan { from { background-position: 0 0; } to { background-position: 0 8px; } }
        @keyframes hof-glitch-in {
          0% { opacity: 0; filter: brightness(3) contrast(2); transform: translateX(-8px); }
          15% { opacity: 1; transform: translateX(6px); }
          30% { transform: translateX(-3px); }
          45% { transform: translateX(2px); }
          100% { opacity: 1; filter: none; transform: none; }
        }
        @keyframes hof-pop { from { opacity: 0; transform: translateY(6px) scale(.9); } to { opacity: 1; transform: none; } }
        @keyframes hof-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes hof-idle { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes hof-walkbob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes hof-flame { from { transform: scaleY(1) scaleX(1); } to { transform: scaleY(1.14) scaleX(.93); } }
        @keyframes hof-flicker { from { opacity: .82; transform: scaleY(1); } to { opacity: 1; transform: scaleY(1.18); } }
        @keyframes hof-glowpulse { 0%,100% { opacity: .75; } 50% { opacity: 1; } }
        .hof-scanlines::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none; z-index: 30;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0px, rgba(0,0,0,.14) 1px, transparent 1px, transparent 3px);
          animation: hof-scan 1s linear infinite;
          mix-blend-mode: multiply;
        }
        .hof-blink { animation: hof-blink 1s step-end infinite; }
        .hof-idle { animation: hof-idle 1.8s ease-in-out infinite; }
      `}</style>

      <div aria-hidden className="hof-scanlines" style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none' }} />

      {!entered ? (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 20px',
          }}
        >
          <div
            aria-hidden
            style={{
              width: 64,
              height: 64,
              marginBottom: 28,
              background: '#e4002b',
              clipPath:
                'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              boxShadow: '0 0 0 4px #0a0d08, 0 0 0 6px #4a1018',
            }}
          />

          <p style={{ fontSize: 12, letterSpacing: '.3em', color: '#7a8a5f', fontWeight: 700 }}>
            ROKMC · RESTRICTED TERMINAL
          </p>

          <h1
            style={{
              marginTop: 20,
              fontSize: 'clamp(26px,5.5vw,46px)',
              fontWeight: 900,
              letterSpacing: '.02em',
              lineHeight: 1.4,
              color: '#e6ffd6',
              textShadow: '3px 3px 0 #e4002b, 3px 3px 0 6px rgba(0,0,0,.4)',
            }}
          >
            명예의 전당
          </h1>

          <p style={{ marginTop: 18, fontSize: 13.5, lineHeight: 2, color: '#8fa374', maxWidth: 380 }}>
            여기서부턴 근무 외 구역이다.<br />
            군번과 이름을 대라.
          </p>

          <form onSubmit={enter} style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10, width: 240 }}>
            <input
              value={id}
              onChange={(e) => { setId(e.target.value); setAuthErr(false) }}
              placeholder="기수 (ID)"
              style={{
                padding: '10px 12px',
                background: '#12160d',
                border: '2px solid #3a4530',
                color: '#e6ffd6',
                fontFamily: PIXEL_FONT,
                fontSize: 13,
                textAlign: 'center',
                outline: 'none',
              }}
            />
            <input
              value={pw}
              onChange={(e) => { setPw(e.target.value); setAuthErr(false) }}
              placeholder="이름 (PW)"
              style={{
                padding: '10px 12px',
                background: '#12160d',
                border: '2px solid #3a4530',
                color: '#e6ffd6',
                fontFamily: PIXEL_FONT,
                fontSize: 13,
                textAlign: 'center',
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={booting}
              style={{
                marginTop: 10,
                padding: '14px 0',
                background: booting ? '#5c1420' : '#e4002b',
                color: '#fff',
                border: '3px solid #0a0d08',
                boxShadow: '0 4px 0 #6b0616, 0 4px 0 4px #0a0d08',
                fontFamily: PIXEL_FONT,
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: '.08em',
                cursor: booting ? 'default' : 'pointer',
              }}
            >
              {booting ? '진입 중...' : '▶ 입장하기'}
            </button>
          </form>

          {authErr && (
            <p style={{ marginTop: 14, fontSize: 12.5, color: '#e4002b', fontWeight: 700 }}>
              넌 누구냐
            </p>
          )}

          <p className="hof-blink" style={{ marginTop: 24, fontSize: 11, color: '#5c6b4a', letterSpacing: '.15em' }}>
            PRESS TO ENTER
          </p>
        </div>
      ) : (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, animation: 'hof-glitch-in .5s steps(6) both' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 20,
              padding: '9px 18px',
              background: 'rgba(6,8,5,.7)',
              border: '2px solid #3a4530',
              color: '#8fa374',
              fontFamily: PIXEL_FONT,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            복귀하기
          </button>

          <div ref={fieldRef} style={{ position: 'absolute', inset: 0, background: '#1a1410', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: -camX, top: -camY, width: MAP_W, height: MAP_H }}>
              {/* 바닥: 원목 널판 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#a8814f',
                  backgroundImage: `
                    repeating-linear-gradient(90deg, rgba(0,0,0,.20) 0 2px, transparent 2px 118px),
                    repeating-linear-gradient(0deg, rgba(0,0,0,.10) 0 1px, transparent 1px 26px),
                    repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 13px),
                    linear-gradient(115deg, rgba(255,226,170,.16), transparent 45%)
                  `,
                }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse 62% 58% at 50% 46%, transparent 20%, rgba(20,12,6,.30) 72%, rgba(14,8,4,.62) 100%)',
                  pointerEvents: 'none',
                  zIndex: 4,
                }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(160deg, rgba(255,178,92,.13), rgba(255,140,60,.07) 55%, rgba(120,60,20,.11))',
                  mixBlendMode: 'soft-light',
                  pointerEvents: 'none',
                  zIndex: 7,
                }}
              />

              {/* 중앙 레드카펫 */}
              <div
                style={{
                  position: 'absolute',
                  left: MAP_W / 2 - 130,
                  top: 60,
                  width: 260,
                  height: MAP_H - 160,
                  background: 'linear-gradient(90deg, #7a0f1d, #a3162a 12%, #a3162a 88%, #7a0f1d)',
                  boxShadow: 'inset 10px 0 18px rgba(0,0,0,.35), inset -10px 0 18px rgba(0,0,0,.35)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: MAP_W / 2 - 130,
                  top: 60,
                  width: 260,
                  height: MAP_H - 160,
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,214,120,.14) 0 2px, transparent 2px 34px)',
                }}
              />

              {/* 외곽 벽: 석재 블록 */}
              {(() => {
                const WALL = 44
                const stone =
                  'repeating-linear-gradient(0deg, rgba(0,0,0,.30) 0 2px, transparent 2px 22px),' +
                  'repeating-linear-gradient(90deg, rgba(0,0,0,.30) 0 2px, transparent 2px 46px),' +
                  'linear-gradient(180deg, #6b5641, #3d2e21)'
                const stoneV =
                  'repeating-linear-gradient(90deg, rgba(0,0,0,.30) 0 2px, transparent 2px 22px),' +
                  'repeating-linear-gradient(0deg, rgba(0,0,0,.30) 0 2px, transparent 2px 46px),' +
                  'linear-gradient(90deg, #6b5641, #3d2e21)'
                return (
                  <>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: MAP_W, height: WALL, background: stone, zIndex: 3 }} />
                    <div style={{ position: 'absolute', left: 0, top: WALL - 8, width: MAP_W, height: 8, background: 'linear-gradient(#8a7053,#4a3826)', zIndex: 3 }} />
                    <div style={{ position: 'absolute', left: 0, top: WALL, width: MAP_W, height: 18, background: 'linear-gradient(rgba(0,0,0,.42), transparent)', zIndex: 3, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', left: 0, top: MAP_H - WALL, width: MAP_W, height: WALL, background: stone, zIndex: 3 }} />
                    <div style={{ position: 'absolute', left: 0, top: MAP_H - WALL, width: MAP_W, height: 8, background: 'linear-gradient(#8a7053,#4a3826)', zIndex: 3 }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, width: WALL, height: MAP_H, background: stoneV, zIndex: 3 }} />
                    <div style={{ position: 'absolute', left: WALL - 8, top: 0, width: 8, height: MAP_H, background: 'linear-gradient(90deg,#8a7053,#4a3826)', zIndex: 3 }} />
                    <div style={{ position: 'absolute', left: WALL, top: 0, width: 18, height: MAP_H, background: 'linear-gradient(90deg, rgba(0,0,0,.42), transparent)', zIndex: 3, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', left: MAP_W - WALL, top: 0, width: WALL, height: MAP_H, background: stoneV, zIndex: 3 }} />
                    <div style={{ position: 'absolute', left: MAP_W - WALL, top: 0, width: 8, height: MAP_H, background: 'linear-gradient(270deg,#8a7053,#4a3826)', zIndex: 3 }} />
                    <div style={{ position: 'absolute', left: MAP_W - WALL - 18, top: 0, width: 18, height: MAP_H, background: 'linear-gradient(270deg, rgba(0,0,0,.42), transparent)', zIndex: 3, pointerEvents: 'none' }} />
                  </>
                )
              })()}

              {/* 바닥 조명 웅덩이 */}
              {[
                { x: MAP_W / 2, y: 238 },
                { x: MAP_W / 2, y: 518 },
                { x: 213, y: 428 },
                { x: MAP_W - 213, y: 428 },
              ].map((g, i) => (
                <div
                  key={`pool-${i}`}
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: g.x - 130,
                    top: g.y - 80,
                    width: 260,
                    height: 160,
                    background: 'radial-gradient(ellipse at 50% 50%, rgba(255,222,150,.26), transparent 68%)',
                    pointerEvents: 'none',
                    zIndex: 5,
                    animation: `hof-glowpulse ${3 + i * 0.4}s ease-in-out infinite`,
                  }}
                />
              ))}

              {/* 벽 기둥 + 횃불 벽등 */}
              {(['l', 'r'] as const).map((side) =>
                Array.from({ length: 8 }, (_, i) => 80 + i * 92).map((py) => {
                  const isLeft = side === 'l'
                  const px = isLeft ? 26 : MAP_W - 40
                  return (
                    <div key={`pillar-${side}-${py}`} aria-hidden>
                      <div
                        style={{
                          position: 'absolute',
                          left: px,
                          top: py,
                          width: 14,
                          height: 54,
                          background: `linear-gradient(${isLeft ? '90deg' : '270deg'},#6b5238,#2a1f18)`,
                          boxShadow: `${isLeft ? '3px' : '-3px'} 0 8px rgba(0,0,0,.35)`,
                          borderTop: '2px solid #7d6142',
                          borderBottom: '2px solid #1e150f',
                        }}
                      />
                      <div style={{ position: 'absolute', left: isLeft ? px + 14 : px - 8, top: py + 20, width: 8, height: 6, background: '#8a6a2e', borderRadius: 2 }} />
                      <div
                        style={{
                          position: 'absolute',
                          left: isLeft ? px + 15 : px - 7,
                          top: py + 10,
                          width: 7,
                          height: 12,
                          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                          background: 'radial-gradient(ellipse at 50% 75%, #fff2b8, #f7a12a 55%, #d2521a)',
                          boxShadow: '0 0 16px 6px rgba(255,180,80,.5)',
                          animation: `hof-flicker ${1 + ((py % 5) * 0.12)}s ease-in-out infinite alternate`,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: isLeft ? px - 10 : px - 60,
                          top: py - 18,
                          width: 90,
                          height: 90,
                          background: 'radial-gradient(circle at 50% 50%, rgba(255,190,110,.20), transparent 66%)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  )
                }),
              )}

              {/* 러그 */}
              {[
                { x: 120, y: 250, tone: '#3d6f8c' },
                { x: MAP_W - 270, y: 250, tone: '#7a4a86' },
                { x: 120, y: 540, tone: '#7a4a3d' },
                { x: MAP_W - 270, y: 540, tone: '#3d7a5c' },
              ].map((r, i) => (
                <div key={`rug-${i}`} aria-hidden style={{ position: 'absolute', left: r.x, top: r.y, zIndex: 1 }}>
                  <RugProp tone={r.tone} />
                </div>
              ))}

              {/* 소파 */}
              {[
                { x: 128, y: 236, facing: 'right' as const },
                { x: MAP_W - 262, y: 236, facing: 'left' as const },
                { x: 128, y: 526, facing: 'right' as const },
                { x: MAP_W - 262, y: 526, facing: 'left' as const },
              ].map((s, i) => (
                <div key={`sofa-${i}`} aria-hidden style={{ position: 'absolute', left: s.x, top: s.y, zIndex: 2 }}>
                  <Grounded w={104} h={48}>
                    <SofaProp facing={s.facing} />
                  </Grounded>
                </div>
              ))}

              {/* 테이블 */}
              {[
                { x: 148, y: 292 }, { x: MAP_W - 242, y: 292 },
                { x: 148, y: 582 }, { x: MAP_W - 242, y: 582 },
              ].map((t, i) => (
                <div key={`table-${i}`} aria-hidden style={{ position: 'absolute', left: t.x, top: t.y, zIndex: 3 }}>
                  <Grounded w={62} h={56}>
                    <TableProp />
                  </Grounded>
                </div>
              ))}

              {/* 어항 */}
              {[{ x: 60, y: 400 }, { x: MAP_W - 146, y: 400 }].map((a, i) => (
                <div key={`aq-${i}`} aria-hidden style={{ position: 'absolute', left: a.x, top: a.y, zIndex: 3 }}>
                  <Grounded w={82} h={62}>
                    <AquariumProp id={`${i}`} />
                  </Grounded>
                </div>
              ))}

              {/* 벽난로 */}
              {[{ x: 70, y: 660 }, { x: MAP_W - 162, y: 660 }].map((f, i) => (
                <div key={`fire-${i}`} aria-hidden style={{ position: 'absolute', left: f.x, top: f.y, zIndex: 3 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -34,
                      top: 10,
                      width: 160,
                      height: 130,
                      background: 'radial-gradient(ellipse at 50% 40%, rgba(255,150,60,.26), transparent 68%)',
                      pointerEvents: 'none',
                      animation: `hof-glowpulse ${2.4 + i * 0.5}s ease-in-out infinite`,
                    }}
                  />
                  <Grounded w={88} h={68}>
                    <FireplaceProp />
                  </Grounded>
                </div>
              ))}

              {/* 갑옷 조각상 */}
              {[
                { x: MAP_W / 2 - 196, y: 150 }, { x: MAP_W / 2 + 150, y: 150 },
                { x: MAP_W / 2 - 196, y: 620 }, { x: MAP_W / 2 + 150, y: 620 },
              ].map((s, i) => (
                <div key={`statue-${i}`} aria-hidden style={{ position: 'absolute', left: s.x, top: s.y, zIndex: 3 }}>
                  <Grounded w={44} h={76}>
                    <StatueProp />
                  </Grounded>
                </div>
              ))}

              {/* 책장 */}
              {[
                { x: 62, y: 300 }, { x: 62, y: 640 },
                { x: MAP_W - 108, y: 300 }, { x: MAP_W - 108, y: 640 },
              ].map((s, i) => (
                <div key={`shelf-${i}`} aria-hidden style={{ position: 'absolute', left: s.x, top: s.y, zIndex: 3 }}>
                  <Grounded w={44} h={72}>
                    <ShelfProp />
                  </Grounded>
                </div>
              ))}

              {/* 야자수 */}
              {[
                { x: MAP_W / 2 - 210, y: 300 }, { x: MAP_W / 2 + 164, y: 300 },
                { x: MAP_W / 2 - 210, y: 470 }, { x: MAP_W / 2 + 164, y: 470 },
                { x: 250, y: 150 }, { x: MAP_W - 296, y: 150 },
                { x: 250, y: 690 }, { x: MAP_W - 296, y: 690 },
              ].map((p, i) => (
                <div key={`palm-${i}`} aria-hidden style={{ position: 'absolute', left: p.x, top: p.y, zIndex: 3 }}>
                  <Grounded w={40} h={66}>
                    <PalmProp />
                  </Grounded>
                </div>
              ))}

              {/* 벽걸이 액자 */}
              {[
                { x: 34, y: 288, a: '#c99a3f' }, { x: 34, y: 400, a: '#3b6fe0' },
                { x: 34, y: 690, a: '#2fae8f' },
                { x: MAP_W - 68, y: 288, a: '#e0a52b' }, { x: MAP_W - 68, y: 400, a: '#c94f61' },
                { x: MAP_W - 68, y: 690, a: '#6b4fa0' },
              ].map((p, i) => (
                <div key={`plq-${i}`} aria-hidden style={{ position: 'absolute', left: p.x, top: p.y, zIndex: 3 }}>
                  <PlaqueProp accent={p.a} id={`w-${i}`} />
                </div>
              ))}

              {/* 샹들리에 */}
              {[
                { x: MAP_W / 2 - 48, y: 190 },
                { x: MAP_W / 2 - 48, y: 470 },
                { x: 165, y: 380 },
                { x: MAP_W - 261, y: 380 },
              ].map((c, i) => (
                <div key={`chan-${i}`} aria-hidden style={{ position: 'absolute', left: c.x, top: c.y, zIndex: 6, pointerEvents: 'none' }}>
                  <ChandelierProp />
                </div>
              ))}

              {/* 중앙 진열대: 좌대 위 닻 문장 메달 */}
              <div style={{ position: 'absolute', left: MAP_W / 2 - 60, top: MAP_H / 2 - 78, width: 120, height: 130, zIndex: 3 }}>
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: -40,
                    background: 'radial-gradient(circle, rgba(255,224,160,.32), transparent 68%)',
                    pointerEvents: 'none',
                  }}
                />
                <svg width="120" height="130" viewBox="0 0 120 130">
                  <defs>
                    <radialGradient id="medalGrad" cx="38%" cy="32%">
                      <stop offset="0%" stopColor="#fff3d2" />
                      <stop offset="55%" stopColor="#d9a63e" />
                      <stop offset="100%" stopColor="#7a5518" />
                    </radialGradient>
                    <linearGradient id="pedestalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3a2a20" />
                      <stop offset="100%" stopColor="#1a1210" />
                    </linearGradient>
                  </defs>
                  <ellipse cx="60" cy="122" rx="46" ry="8" fill="rgba(0,0,0,.4)" />
                  <rect x="20" y="102" width="80" height="10" rx="1" fill="url(#pedestalGrad)" stroke="#0d0a08" strokeWidth="1.5" />
                  <rect x="28" y="92" width="64" height="10" rx="1" fill="url(#pedestalGrad)" stroke="#0d0a08" strokeWidth="1.5" />
                  <rect x="36" y="80" width="48" height="12" rx="1" fill="url(#pedestalGrad)" stroke="#0d0a08" strokeWidth="1.5" />
                  <rect x="36" y="80" width="48" height="3" fill="rgba(255,255,255,.08)" />
                  <rect x="52" y="46" width="16" height="34" fill="url(#pedestalGrad)" stroke="#0d0a08" strokeWidth="1.5" />
                  <circle cx="60" cy="34" r="30" fill="url(#medalGrad)" stroke="#241a14" strokeWidth="2.5" />
                  <circle cx="60" cy="34" r="24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
                  <g stroke="#241a14" strokeWidth="2.6" strokeLinecap="round" fill="none">
                    <circle cx="60" cy="24" r="4" fill="#241a14" stroke="none" />
                    <path d="M60 28v18" />
                    <path d="M50 40h20" />
                    <path d="M48 40a12 12 0 0 0 12 13 12 12 0 0 0 12-13" />
                  </g>
                </svg>
                <div style={{ marginTop: -6, textAlign: 'center', fontSize: 8.5, letterSpacing: '.15em', color: '#c99a3f', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  정의와 자유를 위하여
                </div>
              </div>

              {/* 하우스 배너 */}
              {([
                { bx: 160, key: 'frontend' as const },
                { bx: MAP_W / 2 - 220, key: 'backend' as const },
                { bx: MAP_W / 2 + 220, key: 'pm' as const },
                { bx: MAP_W - 160, key: 'corps' as const },
              ]).map(({ bx, key }) => (
                <div key={bx} aria-hidden style={{ position: 'absolute', left: bx - 16, top: 40, width: 32, height: 96, zIndex: 4 }}>
                  <div style={{ width: 32, height: 96, background: `linear-gradient(${HOUSES[key].primary},${HOUSES[key].dark})`, clipPath: 'polygon(0 0,100% 0,100% 85%,50% 100%,0 85%)', boxShadow: `0 8px 16px rgba(0,0,0,.4), 0 0 16px ${HOUSES[key].glow}` }} />
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ position: 'absolute', top: 18, left: 6 }} fill="none" stroke="#ffe9c2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={HOUSE_EMBLEM[key]} />
                  </svg>
                  <p style={{ position: 'absolute', top: 66, left: 0, width: 32, textAlign: 'center', fontSize: 7, color: '#ffe9c2', fontWeight: 700 }}>{HOUSES[key].label}</p>
                </div>
              ))}

              {/* 스포트라이트 빔 */}
              {doors.map((n) => {
                const spotStyle =
                  n.wall === 'top'
                    ? { left: n.x - 60, top: n.y - 20, width: 120, height: 130, bg: 'radial-gradient(ellipse at 50% 0%, rgba(255,230,160,.16), transparent 70%)' }
                    : n.wall === 'left'
                      ? { left: n.x - 20, top: n.y - 60, width: 130, height: 120, bg: 'radial-gradient(ellipse at 0% 50%, rgba(255,230,160,.16), transparent 70%)' }
                      : { left: n.x - 110, top: n.y - 60, width: 130, height: 120, bg: 'radial-gradient(ellipse at 100% 50%, rgba(255,230,160,.16), transparent 70%)' }
                return (
                  <div
                    key={`${n.cohort}-${n.name}-spot`}
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: spotStyle.left,
                      top: spotStyle.top,
                      width: spotStyle.width,
                      height: spotStyle.height,
                      background: spotStyle.bg,
                      pointerEvents: 'none',
                      zIndex: 4,
                    }}
                  />
                )
              })}

              {/* 전시실 문 + 명패 + 미니맵 안내판 */}
              {doors.map((n) => {
                const isSelf = !!self && n.cohort === self.cohort && n.name === self.name
                const isNear = !!nearby && nearby.cohort === n.cohort && nearby.name === n.name
                const isSignNear = !!mapSign && mapSign.cohort === n.cohort && mapSign.name === n.name
                const house = houseOf(n.roles)
                const doorKey = `${n.cohort}-${n.name}`
                const isOpening = openingDoor === doorKey
                const doorRotate = n.wall === 'left' ? 90 : n.wall === 'right' ? -90 : 0
                const frameSide: 'up' | 'left' | 'right' = n.wall === 'top' ? 'up' : n.wall === 'left' ? 'left' : 'right'
                const plateOffset = frameSide === 'up' ? { x: -42, y: 32 } : { x: -42, y: 40 }
                const signOffset = frameSide === 'up' ? { x: 54, y: 32 } : { x: -17, y: -62 }
                const signPromptOffset = frameSide === 'up' ? { x: 46, y: 10 } : { x: -30, y: -84 }

                return (
                  <div key={doorKey} style={{ position: 'absolute', left: n.x, top: n.y, zIndex: 5 }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: frameSide === 'up' ? -44 : frameSide === 'left' ? -20 : 20 - 88,
                        top: frameSide === 'up' ? -50 : -44,
                        width: frameSide === 'up' ? 88 : 22,
                        height: frameSide === 'up' ? 22 : 88,
                        background: `linear-gradient(${frameSide === 'up' ? '' : frameSide === 'left' ? '90deg,' : '270deg,'}${house.primary}, ${house.dark})`,
                        borderRadius: frameSide === 'up' ? '12px 12px 0 0' : frameSide === 'left' ? '12px 0 0 12px' : '0 12px 12px 0',
                        border: '2px solid #1a1210',
                        boxShadow: `0 0 10px ${house.glow}`,
                      }}
                    />
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffe9c2"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        position: 'absolute',
                        left: frameSide === 'up' ? -8 : frameSide === 'left' ? -14 : -2,
                        top: frameSide === 'up' ? -46 : -8,
                      }}
                    >
                      <path d={HOUSE_EMBLEM[house.key]} />
                    </svg>

                    <div
                      role={isNear ? 'button' : undefined}
                      aria-hidden={!isNear}
                      onClick={isNear ? () => talkTo(n) : undefined}
                      className={isOpening ? undefined : 'hof-idle'}
                      style={{
                        position: 'absolute',
                        left: -34,
                        top: -25,
                        width: 68,
                        height: 50,
                        background: n.discharged
                          ? 'linear-gradient(#3a3430,#232019)'
                          : `linear-gradient(${house.primary}, ${house.dark})`,
                        border: `3px solid ${isSelf ? '#e4002b' : isNear ? '#ffe9c2' : '#c99a3f'}`,
                        boxShadow: isSelf ? '0 0 14px 2px rgba(228,0,43,.6)' : '0 8px 14px rgba(0,0,0,.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: `rotate(${doorRotate}deg) ${isOpening ? 'scaleX(0.1)' : 'scaleX(1)'}`,
                        transformOrigin: 'center',
                        transition: 'transform .35s ease',
                        cursor: isNear ? 'pointer' : 'default',
                        pointerEvents: isNear ? 'auto' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,.85)', transform: `rotate(${-doorRotate}deg)` }}>
                        {n.name.charAt(0)}
                      </span>
                    </div>

                    {isNear && (
                      <span
                        style={{
                          position: 'absolute',
                          left: -24,
                          top: frameSide === 'up' ? -58 : -50,
                          padding: '2px 7px',
                          background: '#e4002b',
                          color: '#fff',
                          fontSize: 9.5,
                          fontWeight: 900,
                          whiteSpace: 'nowrap',
                          animation: 'hof-bob .5s ease-in-out infinite',
                        }}
                      >
                        [E] 입장
                      </span>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        left: plateOffset.x,
                        top: plateOffset.y,
                        width: 84,
                        padding: '3px 4px',
                        background: '#151009',
                        border: `1px solid ${n.discharged ? '#4a352a' : house.primary}`,
                        fontSize: 8,
                        textAlign: 'center',
                        color: n.discharged ? '#7a6a55' : '#e6d9c4',
                      }}
                    >
                      <div>{n.name} · {n.discharged ? '예비역' : n.cohort}</div>
                      {!n.discharged && (
                        <div style={{ marginTop: 1, fontSize: 7, color: house.primary, fontWeight: 700 }}>
                          {house.label}
                        </div>
                      )}
                    </div>

                    <div
                      role={isSignNear ? 'button' : undefined}
                      aria-hidden={!isSignNear}
                      onClick={isSignNear ? () => setShowMap(n) : undefined}
                      style={{
                        position: 'absolute',
                        left: signOffset.x,
                        top: signOffset.y,
                        width: 34,
                        height: 26,
                        background: '#20160f',
                        border: `2px solid ${isSignNear ? '#ffe9c2' : '#4a352a'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isSignNear ? 'pointer' : 'default',
                        pointerEvents: isSignNear ? 'auto' : 'none',
                      }}
                    >
                      <svg width="20" height="14" viewBox="0 0 20 14" shapeRendering="crispEdges">
                        <rect x="0" y="0" width="20" height="14" fill="#8a5a34" />
                        <rect x="2" y="2" width="6" height="4" fill="#5c7a4a" />
                        <rect x="12" y="2" width="6" height="4" fill="#5c7a4a" />
                        <rect x="8" y="8" width="4" height="4" fill="#c99a3f" />
                      </svg>
                    </div>
                    {isSignNear && (
                      <span
                        style={{
                          position: 'absolute',
                          left: signPromptOffset.x,
                          top: signPromptOffset.y,
                          padding: '2px 7px',
                          background: '#3a4530',
                          color: '#e6ffd6',
                          fontSize: 9,
                          fontWeight: 900,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        [E] 안내판 읽기
                      </span>
                    )}
                  </div>
                )
              })}

              {/* 장식 오브젝트 상호작용 프롬프트 */}
              {nearProp && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: nearProp.x - 34,
                    top: nearProp.y - 52,
                    padding: '3px 8px',
                    background: '#c99a3f',
                    color: '#2a1c12',
                    fontSize: 9.5,
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    zIndex: 9,
                    boxShadow: '0 2px 8px rgba(0,0,0,.5)',
                    animation: 'hof-bob .55s ease-in-out infinite',
                  }}
                >
                  [E] {nearProp.label}
                </span>
              )}

              {/* 입구 게이트 */}
              <div aria-hidden style={{ position: 'absolute', left: MAP_W / 2 - 110, top: MAP_H - 168, width: 220, height: 150, zIndex: 4 }}>
                <svg width="220" height="150" viewBox="0 0 220 150">
                  <defs>
                    <radialGradient id="gateGlow" cx="50%" cy="15%">
                      <stop offset="0%" stopColor="rgba(255,230,170,.45)" />
                      <stop offset="100%" stopColor="rgba(255,230,170,0)" />
                    </radialGradient>
                    <linearGradient id="gateStone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4a352a" />
                      <stop offset="100%" stopColor="#241a14" />
                    </linearGradient>
                  </defs>
                  <ellipse cx="110" cy="40" rx="100" ry="60" fill="url(#gateGlow)" />
                  <path d="M40 150 L180 150 L165 132 L55 132 Z" fill="#3a2a20" stroke="#1a1210" strokeWidth="1.5" />
                  <path d="M55 132 L165 132 L153 116 L67 116 Z" fill="#4a3628" stroke="#1a1210" strokeWidth="1.5" />
                  <path d="M67 116 L153 116 L143 102 L77 102 Z" fill="#5c4230" stroke="#1a1210" strokeWidth="1.5" />
                  <rect x="52" y="18" width="18" height="90" fill="url(#gateStone)" stroke="#0d0a08" strokeWidth="2" />
                  <rect x="150" y="18" width="18" height="90" fill="url(#gateStone)" stroke="#0d0a08" strokeWidth="2" />
                  <rect x="52" y="18" width="6" height="90" fill="rgba(255,255,255,.06)" />
                  <rect x="150" y="18" width="6" height="90" fill="rgba(255,255,255,.06)" />
                  <path d="M46 22 Q110 -18 174 22 L174 8 Q110 -32 46 8 Z" fill="url(#gateStone)" stroke="#0d0a08" strokeWidth="2" />
                  <circle cx="61" cy="30" r="6" fill="#ffe9a8" stroke="#7a5518" strokeWidth="1.4" />
                  <circle cx="159" cy="30" r="6" fill="#ffe9a8" stroke="#7a5518" strokeWidth="1.4" />
                  <rect x="82" y="46" width="56" height="16" fill="#151009" stroke="#c99a3f" strokeWidth="1.2" />
                </svg>
                <div style={{ marginTop: -8, textAlign: 'center', fontSize: 9, letterSpacing: '.2em', color: '#e6d9c4', fontWeight: 700 }}>
                  정 &nbsp;문
                </div>
              </div>

              {/* 플레이어 캐릭터 */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%,-70%)',
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.5))',
                  zIndex: 8,
                }}
              >
                <div style={{ animation: walking ? 'hof-walkbob .22s ease-in-out infinite' : undefined }}>
                  <TopDownGuy tint="#e4002b" legPhase={walking ? legPhase : 0} />
                </div>
              </div>
            </div>
          </div>

          {/* 장식 오브젝트 대화창 */}
          {propMsg && (
            <div
              onClick={() => setPropMsg(null)}
              style={{
                position: 'fixed',
                left: '50%',
                bottom: 28,
                transform: 'translateX(-50%)',
                width: 'min(560px, 92vw)',
                zIndex: 45,
                background: 'linear-gradient(#241a12, #16100a)',
                border: '3px solid #c99a3f',
                boxShadow: '0 14px 40px rgba(0,0,0,.6), inset 0 0 24px rgba(201,154,63,.12)',
                padding: '14px 18px 16px',
                cursor: 'pointer',
                animation: 'hof-pop .22s ease both',
              }}
            >
              <p style={{ fontSize: 10.5, letterSpacing: '.22em', color: '#c99a3f', fontWeight: 900 }}>
                {propMsg.label}
              </p>
              {propMsg.lines.map((ln, i) => (
                <p key={i} style={{ marginTop: i === 0 ? 8 : 4, fontSize: 13, lineHeight: 1.7, color: '#f0e2c4' }}>
                  {ln}
                </p>
              ))}
              <p style={{ marginTop: 10, textAlign: 'right', fontSize: 9.5, color: '#8a7255' }}>
                클릭 또는 ESC로 닫기
              </p>
            </div>
          )}

          {/* 전시실 입장 오버레이 */}
          {active && (
            <div
              onClick={() => setActive(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                background: 'rgba(6,8,5,.86)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                animation: 'hof-pop .3s ease both',
              }}
            >
              <div
                key={`${active.name}-${bark}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: 520,
                  maxHeight: '92vh',
                  overflowY: 'auto',
                  background: 'linear-gradient(#221a12,#161009)',
                  border: `3px solid ${active.discharged ? '#6b4a2e' : houseOf(active.roles).primary}`,
                  boxShadow: `0 24px 60px rgba(0,0,0,.6)${active.discharged ? '' : `, 0 0 40px ${houseOf(active.roles).glow}`}`,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'relative',
                    height: 190,
                    overflow: 'hidden',
                    borderBottom: `2px solid ${active.discharged ? '#4a352a' : houseOf(active.roles).primary}`,
                  }}
                >
                  <svg width="100%" height="100%" viewBox="0 0 520 190" preserveAspectRatio="xMidYMax slice">
                    <defs>
                      <pattern id="floorTiles" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M0 0 L30 30 M30 0 L0 30" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect x="0" y="0" width="520" height="190" fill="#2a1f18" />
                    <rect x="0" y="120" width="520" height="70" fill="#8a5a34" />
                    <rect x="0" y="120" width="520" height="70" fill="url(#floorTiles)" opacity="0.5" />

                    <g opacity="0.9" transform="translate(180,10)">
                      <path
                        d="M10 70 Q30 20 80 25 Q120 28 130 55 Q140 75 115 80 Q140 85 150 105 Q120 115 95 100 Q75 118 45 108 Q55 90 40 78 Q15 90 5 75 Z"
                        fill="none"
                        stroke={active.discharged ? '#6b4a2e' : houseOf(active.roles).primary}
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      <circle cx="18" cy="70" r="3" fill="#e4002b" />
                      <path d="M8 68 Q2 66 4 60" stroke={active.discharged ? '#6b4a2e' : houseOf(active.roles).primary} strokeWidth="2.4" fill="none" />
                      <path d="M115 45 Q128 35 140 40" stroke={active.discharged ? '#6b4a2e' : houseOf(active.roles).primary} strokeWidth="2.4" fill="none" />
                      <path d="M130 60 Q142 60 148 68" stroke={active.discharged ? '#6b4a2e' : houseOf(active.roles).primary} strokeWidth="2.4" fill="none" />
                    </g>

                    <g transform="translate(24,60)">
                      <rect x="0" y="0" width="46" height="60" fill="#1a1210" stroke="#6b4a2e" strokeWidth="2" />
                      <rect x="4" y="4" width="38" height="52" fill="rgba(255,224,160,.06)" />
                      <ellipse cx="23" cy="42" rx="12" ry="4" fill="rgba(0,0,0,.3)" />
                      <path d="M23 16 a8 8 0 1 0 0.01 0 M23 24v10M17 40h12M15 34h4M27 34h4" stroke="#c99a3f" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                    </g>
                    <g transform="translate(450,60)">
                      <rect x="0" y="0" width="46" height="60" fill="#1a1210" stroke="#6b4a2e" strokeWidth="2" />
                      <rect x="4" y="4" width="38" height="52" fill="rgba(255,224,160,.06)" />
                      <ellipse cx="23" cy="42" rx="12" ry="4" fill="rgba(0,0,0,.3)" />
                      <path d="M14 40 L23 14 L32 40 Z" fill="none" stroke="#c99a3f" strokeWidth="2.2" strokeLinejoin="round" />
                    </g>

                    <defs>
                      <radialGradient id="trophyGrad" cx="35%" cy="30%">
                        <stop offset="0%" stopColor="#ffe9a8" />
                        <stop offset="100%" stopColor="#8a5a1a" />
                      </radialGradient>
                    </defs>
                    {[150, 250, 350].map((tx) => (
                      <g key={tx} transform={`translate(${tx},128)`}>
                        <ellipse cx="30" cy="34" rx="30" ry="6" fill="rgba(0,0,0,.25)" />
                        <rect x="4" y="0" width="52" height="10" fill="#5c3f2a" stroke="#241a14" strokeWidth="1.5" />
                        <rect x="8" y="10" width="6" height="18" fill="#3a2818" />
                        <rect x="46" y="10" width="6" height="18" fill="#3a2818" />
                        <circle cx="30" cy="-4" r="6" fill="url(#trophyGrad)" stroke="#241a14" strokeWidth="1.2" />
                      </g>
                    ))}
                  </svg>

                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(rgba(0,0,0,0) 55%, rgba(22,16,9,1) 100%)',
                    }}
                  />
                </div>

                <div style={{ padding: '20px 26px 26px' }}>
                  <p style={{ fontSize: 10.5, letterSpacing: '.25em', color: '#8a7255', fontWeight: 700 }}>
                    {active.discharged ? '예비역 전시실' : `${active.cohort} · ${houseOf(active.roles).label} 전시실`}
                  </p>

                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      aria-hidden
                      style={{
                        width: 56,
                        height: 56,
                        flexShrink: 0,
                        background: active.discharged
                          ? 'linear-gradient(135deg,#3a3430,#232019)'
                          : `linear-gradient(135deg, ${houseOf(active.roles).primary}, ${houseOf(active.roles).dark})`,
                        border: '2px solid #6b4a2e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        fontWeight: 900,
                        color: 'rgba(255,255,255,.9)',
                      }}
                    >
                      {active.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 900, color: '#e6ffd6' }}>{active.name}</p>
                      <p style={{ marginTop: 3, fontSize: 12, color: '#8fa374' }}>
                        {active.cohort} · {active.roles.filter(Boolean).join(' · ') || '전우'}
                      </p>
                    </div>
                  </div>

                  <p style={{ marginTop: 16, fontSize: 13.5, color: '#e4002b', fontWeight: 700 }}>
                    "{bark}"
                  </p>

                  <div style={{ marginTop: 18, borderTop: '1px solid #3a2a1e', paddingTop: 14 }}>
                    <p style={{ fontSize: 10.5, letterSpacing: '.2em', color: '#6f8058', fontWeight: 700 }}>
                      업적 · 트로피
                    </p>
                    <p style={{ marginTop: 8, fontSize: 12, color: '#54633f' }}>
                      진열대가 준비됐다. 업적은 곧 채워질 예정.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    style={{
                      marginTop: 22,
                      width: '100%',
                      padding: '11px 0',
                      background: 'transparent',
                      border: '2px solid #3a4530',
                      color: '#8fa374',
                      fontFamily: PIXEL_FONT,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    나가기 (ESC)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 안내판(미니맵) 오버레이 */}
          {showMap && (
            <div
              onClick={() => setShowMap(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                background: 'rgba(6,8,5,.86)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                animation: 'hof-pop .25s ease both',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  background: '#1a140e',
                  border: '3px solid #4a352a',
                  boxShadow: '0 20px 50px rgba(0,0,0,.6)',
                  padding: 18,
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 900, color: '#e6d9c4', textAlign: 'center' }}>
                  {showMap.name} 전시실 안내도
                </p>
                <p style={{ marginTop: 4, fontSize: 10, color: '#8a7255', textAlign: 'center' }}>
                  {showMap.discharged ? '예비역' : showMap.cohort}
                </p>

                <div
                  style={{
                    marginTop: 14,
                    height: 160,
                    background: '#2a1f18',
                    border: '2px solid #4a352a',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <svg width="100%" height="100%" viewBox="0 0 200 130" preserveAspectRatio="none">
                    <rect x="4" y="4" width="192" height="122" fill="#8a5a34" stroke="#241a14" strokeWidth="4" />
                    <rect x="14" y="14" width="60" height="30" fill="#5c7a4a" />
                    <rect x="126" y="14" width="60" height="30" fill="#5c7a4a" />
                    <rect x="80" y="50" width="40" height="40" fill={houseOf(showMap.roles).primary} opacity="0.7" />
                    <rect x="14" y="90" width="30" height="24" fill="#3a2a20" />
                    <rect x="156" y="90" width="30" height="24" fill="#3a2a20" />
                  </svg>
                </div>

                <p style={{ marginTop: 12, fontSize: 10.5, lineHeight: 1.7, color: '#8fa374', textAlign: 'center' }}>
                  중앙 진열대에 업적이 전시될 예정.
                </p>

                <button
                  type="button"
                  onClick={() => setShowMap(null)}
                  style={{
                    marginTop: 16,
                    width: '100%',
                    padding: '9px 0',
                    background: 'transparent',
                    border: '2px solid #3a4530',
                    color: '#8fa374',
                    fontFamily: PIXEL_FONT,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  닫기 (ESC)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
