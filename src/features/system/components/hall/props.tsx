import type { ReactNode } from 'react'

// 탑뷰 캐릭터: 전투복 + 팔각모 + 빨간 명찰 + 걷는 다리
export function TopDownGuy({
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
      <rect
        x={11 - legSpread}
        y="20"
        width="4"
        height="10"
        fill="#2c3324"
        stroke={outline}
        strokeWidth={1}
      />
      <rect
        x={13 + legSpread}
        y="20"
        width="4"
        height="10"
        fill="#2c3324"
        stroke={outline}
        strokeWidth={1}
      />
      <rect
        x={10.5 - legSpread}
        y="27"
        width="5"
        height="3.5"
        fill="#171a12"
        stroke={outline}
        strokeWidth={0.8}
      />
      <rect
        x={12.5 + legSpread}
        y="27"
        width="5"
        height="3.5"
        fill="#171a12"
        stroke={outline}
        strokeWidth={0.8}
      />
      <rect
        x="6"
        y="11"
        width="16"
        height="14"
        rx="2"
        fill="#4a5240"
        stroke={outline}
        strokeWidth={1.4}
      />
      <rect
        x="6"
        y="11"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="rgba(0,0,0,.18)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <rect
        x="4.5"
        y="11"
        width="3.5"
        height="7"
        fill={tint}
        stroke={outline}
        strokeWidth={1}
      />
      <rect
        x="20"
        y="11"
        width="3.5"
        height="7"
        fill={tint}
        stroke={outline}
        strokeWidth={1}
      />
      <rect
        x="6"
        y="21"
        width="16"
        height="2.4"
        fill="#3a2a1e"
        stroke={outline}
        strokeWidth={0.6}
      />
      <rect
        x="15.5"
        y="14"
        width="5.5"
        height="2.6"
        fill="#e4002b"
        stroke="#5c0714"
        strokeWidth={0.6}
      />
      <polygon
        points="14,3.2 18,4.6 20.2,8 18,11.4 14,12.8 10,11.4 7.8,8 10,4.6"
        fill="#3a4530"
        stroke={outline}
        strokeWidth={1.3}
      />
      <circle cx="14" cy="8.6" r="4.4" fill="#e4c9a8" />
      <path
        d="M9.6 7 A4.4 4.4 0 0 1 18.4 7"
        fill="none"
        stroke="rgba(0,0,0,.28)"
        strokeWidth="1.4"
      />
    </svg>
  )
}

// 가구: 3인용 소파
export function SofaProp({ facing = 'right' }: { facing?: 'left' | 'right' }) {
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
      <rect
        x="6"
        y="4"
        width="84"
        height="18"
        rx="6"
        fill="url(#sofaBack)"
        stroke="#2c0a10"
        strokeWidth="1.6"
      />
      <rect
        x="2"
        y="20"
        width="92"
        height="20"
        rx="5"
        fill="url(#sofaBody)"
        stroke="#2c0a10"
        strokeWidth="1.6"
      />
      <path
        d="M33 22v16M63 22v16"
        stroke="#3a0c14"
        strokeWidth="1.3"
        opacity="0.6"
      />
      <path
        d="M6 26h84"
        stroke="rgba(0,0,0,.22)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <path d="M4 21h88 v5 a44 5 0 0 1 -88 0 Z" fill="rgba(0,0,0,.26)" />
      <rect
        x="0"
        y="10"
        width="12"
        height="30"
        rx="5"
        fill="url(#sofaBody)"
        stroke="#2c0a10"
        strokeWidth="1.6"
      />
      <rect
        x="84"
        y="10"
        width="12"
        height="30"
        rx="5"
        fill="url(#sofaBody)"
        stroke="#2c0a10"
        strokeWidth="1.6"
      />
      <rect
        x="2"
        y="12"
        width="8"
        height="4"
        rx="2"
        fill="rgba(255,255,255,.20)"
      />
      <rect
        x="86"
        y="12"
        width="8"
        height="4"
        rx="2"
        fill="rgba(255,255,255,.20)"
      />
      <rect x="8" y="40" width="4" height="8" fill="#3a2a1e" />
      <rect x="84" y="40" width="4" height="8" fill="#3a2a1e" />
      <path
        d="M10 8h76"
        stroke="rgba(255,255,255,.24)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 39h88"
        stroke="rgba(0,0,0,.30)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

// 가구: 대형 화분(야자수)
export function PalmProp() {
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
      <path
        d="M9 44 L37 44 L33 66 L13 66 Z"
        fill="url(#potGrad)"
        stroke="#2e2118"
        strokeWidth="1.6"
      />
      <rect
        x="9"
        y="42"
        width="28"
        height="6"
        rx="1.5"
        fill="#8a5a34"
        stroke="#2e2118"
        strokeWidth="1.4"
      />
      <path d="M13 66h20" stroke="#2e2118" strokeWidth="1.4" opacity="0.5" />
    </svg>
  )
}

// 가구: 책장
export function ShelfProp() {
  return (
    <svg width="46" height="76" viewBox="0 0 46 76">
      <defs>
        <linearGradient id="shelfFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5c4030" />
          <stop offset="100%" stopColor="#2a1c12" />
        </linearGradient>
      </defs>
      <ellipse cx="23" cy="74" rx="19" ry="4" fill="rgba(0,0,0,.3)" />
      <rect
        x="1"
        y="1"
        width="44"
        height="72"
        rx="2"
        fill="url(#shelfFrame)"
        stroke="#2e2118"
        strokeWidth="2"
      />
      <rect x="2" y="2" width="4" height="70" fill="rgba(255,240,210,.13)" />
      <rect x="39" y="2" width="5" height="70" fill="rgba(0,0,0,.26)" />
      {[0, 1, 2, 3].map((row) => (
        <g key={row}>
          <rect
            x="4"
            y={5 + row * 17}
            width="38"
            height="14"
            fill="#160f0a"
            opacity="0.72"
          />
          <rect
            x="3"
            y={18 + row * 17}
            width="40"
            height="2.6"
            fill="#6b5238"
          />
          <rect
            x="3"
            y={20.2 + row * 17}
            width="40"
            height="1.2"
            fill="rgba(0,0,0,.4)"
          />
          {Array.from({ length: 7 }, (_, b) => {
            const colors = [
              '#8a2230',
              '#c9932e',
              '#2d6b9e',
              '#3f8a5c',
              '#6b4fa0',
              '#b0552a',
            ]
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
export function PlaqueProp({ accent, id }: { accent: string; id: string }) {
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
      <rect
        x="2.5"
        y="2.5"
        width="29"
        height="23"
        fill={`url(#${gradId})`}
        stroke="#6b4a2e"
        strokeWidth="1"
      />
      <path
        d="M5 20 L13 10 L18 16 L23 8 L29 20 Z"
        fill={accent}
        opacity="0.75"
      />
      <circle cx="24" cy="8" r="2.4" fill={accent} opacity="0.9" />
    </svg>
  )
}

// 가구: 어항
export function AquariumProp({ id }: { id: string }) {
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
      <rect
        x="8"
        y="44"
        width="70"
        height="16"
        rx="2"
        fill={`url(#${g}-stand)`}
        stroke="#2e2118"
        strokeWidth="1.6"
      />
      <rect
        x="6"
        y="6"
        width="74"
        height="40"
        rx="3"
        fill={`url(#${g}-w)`}
        stroke="#2e2118"
        strokeWidth="2"
      />
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
      <path
        d="M10 12 h30"
        stroke="rgba(255,255,255,.45)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect
        x="6"
        y="6"
        width="74"
        height="40"
        rx="3"
        fill="none"
        stroke="rgba(255,255,255,.25)"
        strokeWidth="1"
      />
    </svg>
  )
}

// 가구: 원형 테이블 + 촛대
export function TableProp() {
  return (
    <svg width="70" height="62" viewBox="0 0 70 62">
      <defs>
        <radialGradient id="tblTop" cx="38%" cy="30%">
          <stop offset="0%" stopColor="#a57546" />
          <stop offset="100%" stopColor="#5c3f28" />
        </radialGradient>
      </defs>
      <ellipse cx="35" cy="56" rx="26" ry="5" fill="rgba(0,0,0,.32)" />
      <rect
        x="31"
        y="32"
        width="8"
        height="22"
        fill="#4a3020"
        stroke="#2e2118"
        strokeWidth="1.4"
      />
      <ellipse
        cx="35"
        cy="54"
        rx="16"
        ry="5"
        fill="#4a3020"
        stroke="#2e2118"
        strokeWidth="1.4"
      />
      <ellipse
        cx="35"
        cy="30"
        rx="31"
        ry="13"
        fill={'url(#tblTop)'}
        stroke="#2e2118"
        strokeWidth="2"
      />
      <ellipse
        cx="35"
        cy="28"
        rx="24"
        ry="9"
        fill="none"
        stroke="rgba(255,255,255,.14)"
        strokeWidth="1.4"
      />
      <rect x="33" y="14" width="4" height="12" fill="#c9a24a" />
      <ellipse cx="35" cy="26" rx="7" ry="2.6" fill="#a8802f" />
      <ellipse cx="35" cy="12" rx="2.6" ry="4" fill="#ffd97a" />
      <ellipse cx="35" cy="11" rx="1.2" ry="2.2" fill="#fff3c4" />
    </svg>
  )
}

// 가구: 갑옷 조각상
export function StatueProp() {
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
      <rect
        x="7"
        y="66"
        width="32"
        height="12"
        rx="2"
        fill={'url(#stnBase)'}
        stroke="#2e2118"
        strokeWidth="1.6"
      />
      <rect
        x="11"
        y="60"
        width="24"
        height="8"
        rx="2"
        fill={'url(#stnBase)'}
        stroke="#2e2118"
        strokeWidth="1.4"
      />
      <path
        d="M14 30 h18 l3 22 h-24 Z"
        fill={'url(#stnBody)'}
        stroke="#2a3238"
        strokeWidth="1.6"
      />
      <path d="M23 32 v20" stroke="rgba(0,0,0,.3)" strokeWidth="1.2" />
      <ellipse
        cx="13"
        cy="32"
        rx="6"
        ry="5"
        fill={'url(#stnBody)'}
        stroke="#2a3238"
        strokeWidth="1.4"
      />
      <ellipse
        cx="33"
        cy="32"
        rx="6"
        ry="5"
        fill={'url(#stnBody)'}
        stroke="#2a3238"
        strokeWidth="1.4"
      />
      <path
        d="M16 20 a7 8 0 0 1 14 0 v8 h-14 Z"
        fill={'url(#stnBody)'}
        stroke="#2a3238"
        strokeWidth="1.6"
      />
      <rect x="19" y="23" width="8" height="3" fill="#1d252b" />
      <path d="M23 12 q5 -6 3 -10 q-6 3 -3 10Z" fill="#c02a3c" />
      <rect x="10" y="52" width="26" height="4" fill="#3a444c" opacity="0.8" />
    </svg>
  )
}

// 가구: 벽난로
export function FireplaceProp() {
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
      <rect
        x="4"
        y="6"
        width="84"
        height="60"
        rx="3"
        fill={'url(#fpStone)'}
        stroke="#2b251e"
        strokeWidth="2"
      />
      {[0, 1, 2, 3].map((r) => (
        <path
          key={r}
          d={`M6 ${14 + r * 13} h80`}
          stroke="rgba(0,0,0,.28)"
          strokeWidth="1.2"
        />
      ))}
      <rect
        x="0"
        y="0"
        width="92"
        height="10"
        rx="2"
        fill="#5c4030"
        stroke="#2b251e"
        strokeWidth="1.6"
      />
      <path
        d="M24 62 v-22 a22 20 0 0 1 44 0 v22 Z"
        fill="#160d08"
        stroke="#2b251e"
        strokeWidth="1.6"
      />
      <rect x="32" y="55" width="28" height="5" rx="2" fill="#4a2f1a" />
      <rect x="36" y="50" width="20" height="5" rx="2" fill="#5c3a20" />
      <path
        d="M46 56 q-9 -8 -4 -17 q2 5 5 6 q-3 -9 4 -14 q-1 8 5 12 q4 4 3 9 q-1 5 -13 4Z"
        fill={'url(#fpFire)'}
        style={{
          animation: 'hof-flame .9s ease-in-out infinite alternate',
          transformOrigin: '46px 56px',
        }}
      />
      <ellipse cx="46" cy="60" rx="20" ry="6" fill="rgba(255,160,60,.28)" />
    </svg>
  )
}

// 조명: 샹들리에
export function ChandelierProp() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id="chGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(255,226,150,.55)" />
          <stop offset="100%" stopColor="rgba(255,226,150,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="52" rx="62" ry="52" fill={'url(#chGlow)'} />
      <path d="M48 0 v16" stroke="#9c7a3a" strokeWidth="2.5" />
      <path
        d="M40 16 h16 l-4 8 h-8 Z"
        fill="#c9a24a"
        stroke="#6b4f1e"
        strokeWidth="1.4"
      />
      <ellipse
        cx="48"
        cy="44"
        rx="30"
        ry="11"
        fill="none"
        stroke="#c9a24a"
        strokeWidth="3.4"
      />
      <ellipse
        cx="48"
        cy="44"
        rx="30"
        ry="11"
        fill="none"
        stroke="rgba(255,240,200,.5)"
        strokeWidth="1.2"
      />
      <path
        d="M48 24 L20 44 M48 24 L76 44 M48 24 L48 44"
        stroke="#a8862f"
        strokeWidth="2"
      />
      {[
        [20, 44],
        [34, 50],
        [48, 52],
        [62, 50],
        [76, 44],
        [48, 36],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <rect x={cx - 2.5} y={cy - 12} width="5" height="12" fill="#efe2c4" />
          <ellipse
            cx={cx}
            cy={cy - 16}
            rx="3"
            ry="5"
            fill="#ffcf67"
            style={{
              animation: `hof-flicker ${1.1 + i * 0.13}s ease-in-out infinite alternate`,
            }}
          />
          <ellipse cx={cx} cy={cy - 17} rx="1.4" ry="2.6" fill="#fff6d8" />
        </g>
      ))}
      {[26, 38, 50, 62, 72].map((cx, i) => (
        <path
          key={i}
          d={`M${cx} 50 l3 6 l-3 6 l-3 -6 Z`}
          fill="rgba(255,240,200,.7)"
        />
      ))}
    </svg>
  )
}

// 접지 그림자
export function Grounded({
  w,
  h,
  offY = 0,
  children,
}: {
  w: number
  h: number
  offY?: number
  children: ReactNode
}) {
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
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(30,16,6,.46), rgba(30,16,6,.18) 55%, transparent 74%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  )
}

// 장식: 러그
export function RugProp({ tone = '#3d6f8c' }: { tone?: string }) {
  return (
    <svg width="150" height="98" viewBox="0 0 150 98">
      <ellipse cx="75" cy="49" rx="73" ry="47" fill={tone} opacity="0.92" />
      <ellipse
        cx="75"
        cy="49"
        rx="73"
        ry="47"
        fill="none"
        stroke="rgba(0,0,0,.35)"
        strokeWidth="2.5"
      />
      <ellipse
        cx="75"
        cy="49"
        rx="60"
        ry="37"
        fill="none"
        stroke="rgba(255,255,255,.24)"
        strokeWidth="3"
      />
      <ellipse cx="75" cy="49" rx="44" ry="26" fill="rgba(255,255,255,.10)" />
      <ellipse
        cx="75"
        cy="49"
        rx="30"
        ry="17"
        fill="none"
        stroke="rgba(255,255,255,.20)"
        strokeWidth="2.4"
      />
      <ellipse cx="75" cy="49" rx="12" ry="7" fill="rgba(255,255,255,.16)" />
    </svg>
  )
}
