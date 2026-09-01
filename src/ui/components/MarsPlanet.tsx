interface MarsPlanetProps {
  className?: string
  glow?: boolean
  style?: React.CSSProperties
}

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
      <div
        style={{
          position: 'absolute',
          inset: '-30%',
          mixBlendMode: 'multiply',
          backgroundImage:
            'radial-gradient(ellipse 58% 20% at 28% 40%, rgba(120,0,20,0.52), transparent 62%), radial-gradient(ellipse 40% 13% at 72% 60%, rgba(150,10,30,0.46), transparent 62%), radial-gradient(ellipse 28% 9% at 46% 78%, rgba(255,185,175,0.26), transparent 62%), radial-gradient(ellipse 22% 8% at 62% 30%, rgba(110,0,18,0.34), transparent 65%), radial-gradient(ellipse 16% 6% at 20% 62%, rgba(140,5,25,0.3), transparent 65%), radial-gradient(ellipse 12% 5% at 80% 44%, rgba(255,170,160,0.18), transparent 68%)',
        }}
      />
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
      <div
        style={{
          position: 'absolute',
          left: '34%',
          top: '-4%',
          width: '32%',
          height: '13%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 80%, rgba(255,232,226,0.5), transparent 72%)',
          filter: 'blur(6px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 50%, transparent 62%, rgba(255,120,110,0.16) 88%, transparent 100%)',
        }}
      />
    </div>
  )
}
