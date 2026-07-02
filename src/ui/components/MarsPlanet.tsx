interface MarsPlanetProps {
  className?: string
  /** 큰 행성용 외곽 글로우 (아바타 등 작은 곳은 false) */
  glow?: boolean
  style?: React.CSSProperties
}

// CSS 그라데이션으로 그린 화성(빨간 행성). 크기는 className(w/h)으로 조절.
export default function MarsPlanet({ className = '', glow = false, style }: MarsPlanetProps) {
  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(circle at 34% 30%, #ff6a5a 0%, #ef2740 34%, #d5001f 62%, #9c0016 100%)',
        boxShadow: glow
          ? '0 0 90px 22px rgba(228,0,43,0.22), inset -30px -26px 72px rgba(90,0,15,0.68), inset 26px 22px 56px rgba(255,155,155,0.32)'
          : 'inset -5px -4px 12px rgba(90,0,15,0.6), inset 5px 4px 11px rgba(255,160,160,0.35)',
        ...style,
      }}
      aria-hidden
    >
      {/* 표면 결(어두운 띠) */}
      <div
        style={{
          position: 'absolute',
          inset: '-30%',
          mixBlendMode: 'multiply',
          backgroundImage:
            'radial-gradient(ellipse 60% 22% at 30% 42%, rgba(120,0,20,0.5), transparent 60%), radial-gradient(ellipse 42% 14% at 70% 62%, rgba(150,10,30,0.45), transparent 60%), radial-gradient(ellipse 30% 10% at 48% 80%, rgba(255,185,175,0.28), transparent 60%)',
        }}
      />
      {/* 하이라이트 */}
      <div
        style={{
          position: 'absolute',
          left: '18%',
          top: '14%',
          width: '40%',
          height: '34%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, rgba(255,224,214,0.6), transparent 70%)',
          filter: 'blur(5px)',
        }}
      />
    </div>
  )
}
