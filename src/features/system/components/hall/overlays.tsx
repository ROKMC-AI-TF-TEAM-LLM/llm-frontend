import { houseOf } from '@/features/team/houses'
import { PIXEL_FONT, type DoorPos, type PropSpot } from './constants'

// 장식 오브젝트를 살폈을 때 아래에 뜨는 대화창
export function PropDialog({ spot, onClose }: { spot: PropSpot; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
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
        {spot.label}
      </p>
      {spot.lines.map((ln, i) => (
        <p key={i} style={{ marginTop: i === 0 ? 8 : 4, fontSize: 13, lineHeight: 1.7, color: '#f0e2c4' }}>
          {ln}
        </p>
      ))}
      <p style={{ marginTop: 10, textAlign: 'right', fontSize: 9.5, color: '#8a7255' }}>
        클릭 또는 ESC로 닫기
      </p>
    </div>
  )
}

// 문으로 들어간 전시실
export function ExhibitRoom({ door: active, bark, onClose }: { door: DoorPos; bark: string; onClose: () => void }) {
  const house = houseOf(active.roles)
  return (
    <div
      onClick={onClose}
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
          border: `3px solid ${active.discharged ? '#6b4a2e' : house.primary}`,
          boxShadow: `0 24px 60px rgba(0,0,0,.6)${active.discharged ? '' : `, 0 0 40px ${house.glow}`}`,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'relative',
            height: 190,
            overflow: 'hidden',
            borderBottom: `2px solid ${active.discharged ? '#4a352a' : house.primary}`,
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
                stroke={active.discharged ? '#6b4a2e' : house.primary}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <circle cx="18" cy="70" r="3" fill="#e4002b" />
              <path d="M8 68 Q2 66 4 60" stroke={active.discharged ? '#6b4a2e' : house.primary} strokeWidth="2.4" fill="none" />
              <path d="M115 45 Q128 35 140 40" stroke={active.discharged ? '#6b4a2e' : house.primary} strokeWidth="2.4" fill="none" />
              <path d="M130 60 Q142 60 148 68" stroke={active.discharged ? '#6b4a2e' : house.primary} strokeWidth="2.4" fill="none" />
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
            {active.discharged ? '예비역 전시실' : `${active.cohort} · ${house.label} 전시실`}
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
                  : `linear-gradient(135deg, ${house.primary}, ${house.dark})`,
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
            onClick={onClose}
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
  )
}

// 문 옆 안내판(미니맵)
export function RoomMapSign({ door, onClose }: { door: DoorPos; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
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
          {door.name} 전시실 안내도
        </p>
        <p style={{ marginTop: 4, fontSize: 10, color: '#8a7255', textAlign: 'center' }}>
          {door.discharged ? '예비역' : door.cohort}
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
            <rect x="80" y="50" width="40" height="40" fill={houseOf(door.roles).primary} opacity="0.7" />
            <rect x="14" y="90" width="30" height="24" fill="#3a2a20" />
            <rect x="156" y="90" width="30" height="24" fill="#3a2a20" />
          </svg>
        </div>

        <p style={{ marginTop: 12, fontSize: 10.5, lineHeight: 1.7, color: '#8fa374', textAlign: 'center' }}>
          중앙 진열대에 업적이 전시될 예정.
        </p>

        <button
          type="button"
          onClick={onClose}
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
  )
}
