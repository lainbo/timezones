import { memo, useId, useMemo } from 'react'
import { cn } from '@/lib/utils'

type Star = { x: number; y: number; r: number; alpha: number }
type Twinkle = { x: number; y: number; size: number; tint: string; duration: number; delay: number }

const tints = ['255 255 255', '255 255 255', '255 241 222', '226 236 255']

// 以时区 ID 为种子，同一时区的星空在每次渲染和刷新后保持一致
function seededRandom(text: string) {
  let seed = 2166136261
  for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619)
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function createSky(id: string) {
  const random = seededRandom(id)
  const between = (min: number, max: number) => min + (max - min) * random()
  const angle = (between(20, 50) * (random() < 0.5 ? -1 : 1) * Math.PI) / 180
  const band = { x: between(45, 85), y: between(10, 35), dx: Math.cos(angle), dy: Math.sin(angle) }
  const stars: Star[] = []
  // 银河：沿光带方向均匀分布，垂直方向近似正态分布，形成中间密、两侧疏的暗星带
  for (let index = 0; index < 90; index++) {
    const along = between(-90, 90)
    const across = (random() + random() + random() - 1.5) * 12
    stars.push({
      x: band.x + along * band.dx - across * band.dy,
      y: band.y + along * band.dy + across * band.dx,
      r: between(0.3, 0.55),
      alpha: between(0.15, 0.45),
    })
  }
  // 亮度按幂次分布，暗星多、亮星少
  for (let index = 0; index < 50; index++) {
    const brightness = random() ** 2.2
    stars.push({
      x: between(1, 99),
      y: between(1, 99),
      r: 0.4 + brightness * 0.7,
      alpha: 0.28 + brightness * 0.6,
    })
  }
  const twinkles: Twinkle[] = Array.from({ length: 6 }, () => {
    const duration = between(2.8, 6.5)
    return {
      x: between(30, 96),
      y: between(4, 60),
      size: between(6, 11),
      tint: tints[Math.floor(random() * tints.length)],
      duration,
      delay: between(0, duration),
    }
  })
  return {
    band: {
      x1: band.x - 100 * band.dx,
      y1: band.y - 100 * band.dy,
      x2: band.x + 100 * band.dx,
      y2: band.y + 100 * band.dy,
    },
    stars,
    twinkles,
  }
}

export const NightSky = memo(function NightSky({ id, night }: { id: string; night: boolean }) {
  const sky = useMemo(() => createSky(id), [id])
  const glow = useId()
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit] [mask-image:radial-gradient(ellipse_110%_95%_at_100%_0,#000_30%,transparent_90%)] transition-opacity duration-500 motion-reduce:transition-none',
        night ? 'opacity-100' : 'opacity-0',
      )}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 size-full">
        <filter id={glow} filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <line
          x1={`${sky.band.x1}%`}
          y1={`${sky.band.y1}%`}
          x2={`${sky.band.x2}%`}
          y2={`${sky.band.y2}%`}
          stroke="#fff"
          strokeOpacity={0.06}
          strokeWidth={36}
          filter={`url(#${glow})`}
        />
        {sky.stars.map((star, index) => (
          <circle
            key={index}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.r}
            fill="#fff"
            fillOpacity={star.alpha}
          />
        ))}
      </svg>
      {sky.twinkles.map((star, index) => (
        <span
          key={index}
          className={cn('absolute -translate-1/2', night && 'motion-safe:animate-twinkle')}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: `radial-gradient(closest-side, rgb(${star.tint}) 0 0.8px, rgb(${star.tint} / 0.45) 1.6px, rgb(${star.tint} / 0.1) 50%, transparent)`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${-star.delay}s`,
          }}
        />
      ))}
    </div>
  )
})
