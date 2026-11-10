import { houseOf, HOUSE_EMBLEM } from '@/features/team/houses'
import type { DoorPos } from './constants'

// 문 앞 바닥의 스포트라이트
export function DoorSpotlight({ door: n }: { door: DoorPos }) {
  const spotStyle =
    n.wall === 'top'
      ? { left: n.x - 60, top: n.y - 20, width: 120, height: 130, bg: 'radial-gradient(ellipse at 50% 0%, rgba(255,230,160,.16), transparent 70%)' }
      : n.wall === 'left'
        ? { left: n.x - 20, top: n.y - 60, width: 130, height: 120, bg: 'radial-gradient(ellipse at 0% 50%, rgba(255,230,160,.16), transparent 70%)' }
        : { left: n.x - 110, top: n.y - 60, width: 130, height: 120, bg: 'radial-gradient(ellipse at 100% 50%, rgba(255,230,160,.16), transparent 70%)' }
  return (
    <div
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
}

interface HallDoorProps {
  door: DoorPos
  isSelf: boolean
  /** 문 앞에 서 있다 ([E] 입장) */
  isNear: boolean
  /** 안내판 앞에 서 있다 ([E] 안내판 읽기) */
  isSignNear: boolean
  isOpening: boolean
  onEnter: () => void
  onReadSign: () => void
}

// 전시실 문 + 명패 + 미니맵 안내판
export function HallDoor({ door: n, isSelf, isNear, isSignNear, isOpening, onEnter, onReadSign }: HallDoorProps) {
  const house = houseOf(n.roles)
  const doorRotate = n.wall === 'left' ? 90 : n.wall === 'right' ? -90 : 0
  const frameSide: 'up' | 'left' | 'right' = n.wall === 'top' ? 'up' : n.wall === 'left' ? 'left' : 'right'
  const plateOffset = frameSide === 'up' ? { x: -42, y: 32 } : { x: -42, y: 40 }
  const signOffset = frameSide === 'up' ? { x: 54, y: 32 } : { x: -17, y: -62 }
  const signPromptOffset = frameSide === 'up' ? { x: 46, y: 10 } : { x: -30, y: -84 }

  return (
    <div style={{ position: 'absolute', left: n.x, top: n.y, zIndex: 5 }}>
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
        onClick={isNear ? onEnter : undefined}
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
        onClick={isSignNear ? onReadSign : undefined}
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
}
