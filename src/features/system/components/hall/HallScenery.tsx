import { memo } from 'react'
import { HOUSES, HOUSE_EMBLEM } from '@/features/team/houses'
import { MAP_H, MAP_W } from './constants'
import {
  AquariumProp,
  ChandelierProp,
  FireplaceProp,
  Grounded,
  PalmProp,
  PlaqueProp,
  RugProp,
  ShelfProp,
  SofaProp,
  StatueProp,
  TableProp,
} from './props'

// 바닥·벽·조명·가구·배너. 바뀌는 값이 없으므로 memo로 감싸,
// 캐릭터가 움직일 때(매 프레임) 화면이 다시 그려져도 이 부분은 건너뛴다.
export const HallScenery = memo(function HallScenery() {
  return (
    <>
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
    </>
  )
})

// 입구 게이트. 문·스포트라이트보다 뒤에 그려야 겹칠 때 순서가 같다
export const EntranceGate = memo(function EntranceGate() {
  return (
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
  )
})
