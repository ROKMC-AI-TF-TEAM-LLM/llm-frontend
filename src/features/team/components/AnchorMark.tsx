interface AnchorMarkProps {
  size?: number
  angle?: number
  opacity?: number
  grayscale?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function AnchorMark({
  size = 320,
  angle = 0,
  opacity = 0.07,
  grayscale = false,
  className = '',
  style,
}: AnchorMarkProps) {
  return (
    <img
      src="/marslogo.png"
      alt=""
      aria-hidden
      draggable={false}
      className={`select-none ${className}`}
      style={{
        width: size,
        height: 'auto',
        opacity,
        transform: `rotate(${angle}deg)`,
        filter: grayscale ? 'grayscale(1)' : undefined,
        ...style,
      }}
    />
  )
}
