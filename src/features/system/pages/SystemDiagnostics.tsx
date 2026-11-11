import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DIRECTORY,
  type DirectoryEntry,
} from '@/features/team/directoryEntries'
import {
  BARKS,
  DISCHARGE_LINE,
  layoutDoors,
  MAP_H,
  MAP_W,
  PIXEL_FONT,
  PLAYER_R,
  PROP_SPOTS,
  WALK_SPEED,
  type DoorPos,
  type PropSpot,
} from '../components/hall/constants'
import { TopDownGuy } from '../components/hall/props'
import { EntranceGate, HallScenery } from '../components/hall/HallScenery'
import { DoorSpotlight, HallDoor } from '../components/hall/HallDoor'
import {
  ExhibitRoom,
  PropDialog,
  RoomMapSign,
} from '../components/hall/overlays'
import { HallGate } from '../components/hall/HallGate'

// 숨은 화면 "명예의 전당": 팀원 명부로 입장해 탑뷰 맵을 걸어 다니며 전시실 문을 연다.
// 화면 조각은 components/hall/에 있고, 여기에는 상태와 이동 루프만 둔다.
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
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [entered])

  const enter = (e: FormEvent) => {
    e.preventDefault()
    const match = DIRECTORY.find(
      (m) => m.cohort.replace(/\D/g, '') === id.trim() && m.name === pw.trim(),
    )
    if (!match) {
      setAuthErr(true)
      return
    }
    setAuthErr(false)
    setSelf(match)
    setBooting(true)
    window.setTimeout(() => {
      const self0 = doors.find(
        (d) => d.cohort === match.cohort && d.name === match.name,
      )
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
      setBark(
        n.discharged
          ? DISCHARGE_LINE
          : BARKS[Math.floor(Math.random() * BARKS.length)],
      )
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
  const nearby =
    doors
      .map((n) => ({ n, d: Math.hypot(n.x - pos.x, n.y - pos.y) }))
      .filter((v) => v.d <= NEAR_DIST)
      .sort((a, b) => a.d - b.d)[0]?.n ?? null

  const SIGN_DIST = 44
  const mapSign = !nearby
    ? (doors
        .map((n) => ({ n, d: Math.hypot(n.x + 42 - pos.x, n.y - 10 - pos.y) }))
        .filter((v) => v.d <= SIGN_DIST)
        .sort((a, b) => a.d - b.d)[0]?.n ?? null)
    : null

  const PROP_DIST = 54
  const nearProp =
    !nearby && !mapSign
      ? (PROP_SPOTS.map((p) => ({ p, d: Math.hypot(p.x - pos.x, p.y - pos.y) }))
          .filter((v) => v.d <= PROP_DIST)
          .sort((a, b) => a.d - b.d)[0]?.p ?? null)
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

      <div
        aria-hidden
        className="hof-scanlines"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />

      {!entered ? (
        <HallGate
          id={id}
          pw={pw}
          onIdChange={(v) => {
            setId(v)
            setAuthErr(false)
          }}
          onPwChange={(v) => {
            setPw(v)
            setAuthErr(false)
          }}
          booting={booting}
          authErr={authErr}
          onSubmit={enter}
        />
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10,
            animation: 'hof-glitch-in .5s steps(6) both',
          }}
        >
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

          <div
            ref={fieldRef}
            style={{
              position: 'absolute',
              inset: 0,
              background: '#1a1410',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -camX,
                top: -camY,
                width: MAP_W,
                height: MAP_H,
              }}
            >
              <HallScenery />

              {doors.map((n) => (
                <DoorSpotlight key={`${n.cohort}-${n.name}-spot`} door={n} />
              ))}

              {/* 전시실 문 + 명패 + 미니맵 안내판 */}
              {doors.map((n) => {
                const doorKey = `${n.cohort}-${n.name}`
                return (
                  <HallDoor
                    key={doorKey}
                    door={n}
                    isSelf={
                      !!self && n.cohort === self.cohort && n.name === self.name
                    }
                    isNear={
                      !!nearby &&
                      nearby.cohort === n.cohort &&
                      nearby.name === n.name
                    }
                    isSignNear={
                      !!mapSign &&
                      mapSign.cohort === n.cohort &&
                      mapSign.name === n.name
                    }
                    isOpening={openingDoor === doorKey}
                    onEnter={() => talkTo(n)}
                    onReadSign={() => setShowMap(n)}
                  />
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

              <EntranceGate />

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
                <div
                  style={{
                    animation: walking
                      ? 'hof-walkbob .22s ease-in-out infinite'
                      : undefined,
                  }}
                >
                  <TopDownGuy
                    tint="#e4002b"
                    legPhase={walking ? legPhase : 0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 장식 오브젝트 대화창 */}
          {propMsg && (
            <PropDialog spot={propMsg} onClose={() => setPropMsg(null)} />
          )}

          {/* 전시실 입장 오버레이 */}
          {active && (
            <ExhibitRoom
              door={active}
              bark={bark}
              onClose={() => setActive(null)}
            />
          )}

          {/* 안내판(미니맵) 오버레이 */}
          {showMap && (
            <RoomMapSign door={showMap} onClose={() => setShowMap(null)} />
          )}
        </div>
      )}
    </div>
  )
}
