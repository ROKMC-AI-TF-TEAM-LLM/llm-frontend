import type { CSSProperties, FormEvent } from 'react'
import { PIXEL_FONT } from './constants'

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  background: '#12160d',
  border: '2px solid #3a4530',
  color: '#e6ffd6',
  fontFamily: PIXEL_FONT,
  fontSize: 13,
  textAlign: 'center',
  outline: 'none',
}

interface HallGateProps {
  id: string
  pw: string
  onIdChange: (value: string) => void
  onPwChange: (value: string) => void
  booting: boolean
  authErr: boolean
  onSubmit: (e: FormEvent) => void
}

// 입장 화면: 기수(ID)와 이름(PW)을 대야 들어갈 수 있다
export function HallGate({
  id,
  pw,
  onIdChange,
  onPwChange,
  booting,
  authErr,
  onSubmit,
}: HallGateProps) {
  return (
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

      <p
        style={{
          fontSize: 12,
          letterSpacing: '.3em',
          color: '#7a8a5f',
          fontWeight: 700,
        }}
      >
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

      <p
        style={{
          marginTop: 18,
          fontSize: 13.5,
          lineHeight: 2,
          color: '#8fa374',
          maxWidth: 380,
        }}
      >
        여기서부턴 근무 외 구역이다.
        <br />
        군번과 이름을 대라.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: 240,
        }}
      >
        <input
          value={id}
          onChange={(e) => onIdChange(e.target.value)}
          placeholder="기수 (ID)"
          style={inputStyle}
        />
        <input
          value={pw}
          onChange={(e) => onPwChange(e.target.value)}
          placeholder="이름 (PW)"
          style={inputStyle}
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
        <p
          style={{
            marginTop: 14,
            fontSize: 12.5,
            color: '#e4002b',
            fontWeight: 700,
          }}
        >
          넌 누구냐
        </p>
      )}

      <p
        className="hof-blink"
        style={{
          marginTop: 24,
          fontSize: 11,
          color: '#5c6b4a',
          letterSpacing: '.15em',
        }}
      >
        PRESS TO ENTER
      </p>
    </div>
  )
}
