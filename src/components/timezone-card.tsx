import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import * as m from 'framer-motion/m'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowUpRight, GripVertical, Moon, Sun, X } from 'lucide-react'
import { dateText, offsetText, timeText, type Instant } from '@/lib/temporal'
import { zoneInfo } from '@/lib/timezones'

type Props = {
  id: string
  instant: Instant
  base: string
  hour12: boolean
  animateRuler: boolean
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onSlide: (instant: Instant, id: string) => void
}

function nearestRotation(current: number, target: number) {
  return current + ((((target - current) % 360) + 540) % 360) - 180
}

function isDaylight(hour: number) {
  return hour >= 6 && hour < 18
}

function dayPart(hour: number, minute: number) {
  const minutes = hour * 60 + minute
  if (minutes < 60) return { name: '半夜', range: '00:00–01:00' }
  if (minutes < 6 * 60) return { name: '凌晨', range: '01:00–06:00' }
  if (minutes < 12 * 60) return { name: '上午', range: '06:00–12:00' }
  if (minutes < 13 * 60) return { name: '中午', range: '12:00–13:00' }
  if (minutes < 18 * 60) return { name: '下午', range: '13:00–18:00' }
  if (minutes < 19 * 60) return { name: '傍晚', range: '18:00–19:00' }
  return { name: '晚上', range: '19:00–24:00' }
}

export function TimezoneCard({
  id,
  instant,
  base,
  hour12,
  animateRuler,
  onEdit,
  onRemove,
  onSlide,
}: Props) {
  const reducedMotion = useReducedMotion()
  const handTransition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.7 }
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const info = zoneInfo(id)
  const time = instant.toZonedDateTimeISO(id)
  const clockMinutes = time.hour * 60 + time.minute
  const [hands, setHands] = useState({
    clockMinutes,
    hour: clockMinutes * 0.5,
    minute: time.minute * 6,
  })
  if (hands.clockMinutes !== clockMinutes) {
    // 保留连续角度，让 59 分到整点的过渡沿最短方向转动。
    setHands({
      clockMinutes,
      hour: nearestRotation(hands.hour, clockMinutes * 0.5),
      minute: nearestRotation(hands.minute, time.minute * 6),
    })
  }
  const reference = instant.toZonedDateTimeISO(base)
  const dayDifference = reference.toPlainDate().until(time.toPlainDate()).days
  const offsetDifference = (time.offsetNanoseconds - reference.offsetNanoseconds) / 36e11
  const start = time.startOfDay()
  const end = start.add({ days: 1 }).startOfDay()
  const totalMinutes = (end.epochMilliseconds - start.epochMilliseconds) / 60000
  const elapsed = (instant.epochMilliseconds - start.epochMilliseconds) / 60000
  const daylight = isDaylight(time.hour)
  const night = !daylight
  const part = dayPart(time.hour, time.minute)
  const isBase = id === base
  const ticks = Array.from({ length: Math.ceil(totalMinutes / 60) }, (_, index) => {
    const tick = start.add({ hours: index })
    return { hour: tick.hour, offset: tick.offset, daytime: isDaylight(tick.hour) }
  })
  const difference =
    offsetDifference === 0
      ? '时差 0 小时'
      : `${offsetDifference > 0 ? '快' : '慢'} ${Number(Math.abs(offsetDifference).toFixed(2))} 小时`
  return (
    <m.article
      ref={setNodeRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isDragging ? 0.95 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-night={night}
      className={cn(
        'group/card relative isolate min-w-0 rounded-[15px] border px-[23px] pt-[23px] pb-[17px] text-foreground shadow-xs transition-[box-shadow,border-color] duration-200 min-[1450px]:px-[27px] min-[1450px]:pt-[26px] min-[1450px]:pb-5 max-[1100px]:p-6 max-[700px]:rounded-xl max-[700px]:px-[17px] max-[700px]:pt-[19px] max-[700px]:pb-4 max-[480px]:px-[23px] max-[480px]:pt-[23px] max-[480px]:pb-[18px]',
        night ? 'dark border-night-border bg-night' : 'border-border bg-card',
        isBase && 'border-selected-border ring-1 ring-selected-border',
        isDragging && 'z-20 shadow-2xl',
      )}
      aria-label={`${info.city}时区卡片`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 [&>p]:mt-[5px] [&>p]:flex [&>p]:flex-wrap [&>p]:items-center [&>p]:gap-1.5 [&>p]:text-[11px] [&>p]:text-muted-foreground [&>p>span]:text-muted-foreground max-[700px]:[&>p]:text-[9px] max-[480px]:[&>p]:text-[11px]">
          <div className="flex items-center gap-[9px] [&>h2]:m-0 [&>h2]:text-[17px] [&>h2]:leading-[25px] [&>h2]:font-[560] [&>h2]:tracking-[0.3px] max-[700px]:[&>h2]:text-[15px] max-[480px]:[&>h2]:text-lg">
            <h2>{info.city}</h2>
            {isBase && (
              <span className="rounded border border-border px-[5px] py-0.5 text-[9px] tracking-[0.4px] whitespace-nowrap text-muted-foreground">
                基准
              </span>
            )}
          </div>
          <p>
            {info.english}
            <span>·</span>
            {info.region}
          </p>
        </div>
        <div className="-mt-1 -mr-2 flex max-[700px]:-mr-[9px] max-[700px]:[&>button]:w-[22px]">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground touch-none cursor-grab active:cursor-grabbing"
            aria-label={`拖拽排序：${info.city}`}
            title="拖拽排序；也可按空格后使用方向键"
          >
            <GripVertical size={19} />
          </button>
          <button
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 hover:bg-destructive/10 hover:text-primary max-[700px]:opacity-100 [@media(hover:none)]:opacity-100"
            aria-label={`移除${info.city}`}
            onClick={() => onRemove(id)}
          >
            <X size={17} />
          </button>
        </div>
      </div>
      <div className="mt-[23px] flex items-center justify-between gap-1.5 min-[1450px]:mt-[27px] max-[700px]:mt-[21px] max-[480px]:mt-[22px]">
        <button
          className="group/time relative flex items-baseline gap-[7px] border-0 bg-transparent p-0 text-left text-foreground group-data-[night=true]/card:text-night-foreground hover:text-primary [&>span:first-child]:font-['SF_Pro_Display','Helvetica_Neue',Arial,sans-serif] [&>span:first-child]:text-[clamp(35px,4.4vw,61px)] [&>span:first-child]:leading-[1.1] [&>span:first-child]:font-normal [&>span:first-child]:tracking-[-3.2px] [&>span:first-child]:tabular-nums max-[1100px]:[&>span:first-child]:text-[63px] max-[700px]:[&>span:first-child]:text-[46px] max-[700px]:[&>span:first-child]:tracking-[-2.5px] max-[480px]:[&>span:first-child]:text-[64px]"
          onClick={() => onEdit(id)}
          aria-label={`修改${info.city}时间`}
          title="点击设置当地日期和时间"
        >
          <span>{timeText(time, hour12)}</span>
          {hour12 && (
            <span className="text-xs tracking-normal text-muted-foreground">
              {time.hour < 12 ? 'AM' : 'PM'}
            </span>
          )}
          <ArrowUpRight
            className="absolute top-0.5 -right-5 text-primary opacity-0 transition-opacity duration-150 group-hover/time:opacity-100 group-focus-visible/time:opacity-100"
            size={20}
          />
        </button>
        <div
          className="relative mr-0.5 size-[49px] shrink-0 rounded-full border border-border bg-clock-face group-data-[night=true]/card:border-night-border group-data-[night=true]/card:bg-clock-night max-[700px]:mr-0 max-[700px]:size-9 max-[480px]:size-[49px]"
          aria-hidden="true"
        >
          <div className="absolute inset-1 rounded-full bg-[repeating-conic-gradient(var(--clock-tick)_0deg_2deg,transparent_2deg_30deg)] [mask:radial-gradient(transparent_64%,#000_65%)]" />
          <m.i
            initial={false}
            animate={{ rotate: hands.hour }}
            transition={handTransition}
            className="absolute bottom-1/2 left-[calc(50%-1px)] h-3 w-0.5 origin-bottom rounded-[2px] bg-clock-hour max-[700px]:h-[9px] max-[480px]:h-3"
          />
          <m.i
            initial={false}
            animate={{ rotate: hands.minute }}
            transition={handTransition}
            className="absolute bottom-1/2 left-[calc(50%-1px)] h-[17px] w-[1.5px] origin-bottom rounded-[2px] bg-clock-minute max-[700px]:h-3 max-[480px]:h-[17px]"
          />
          <i className="absolute top-[calc(50%-2px)] left-[calc(50%-2px)] size-1 rounded-full bg-primary" />
        </div>
      </div>
      <div className="mt-[9px] mb-[23px] flex min-h-5 items-center gap-[7px] text-[11px] text-muted-foreground max-[700px]:gap-1 max-[700px]:text-[10px] max-[480px]:mb-[22px] max-[480px]:text-[11px]">
        <span>{dateText(time)}</span>
        {dayDifference !== 0 && (
          <span className="rounded bg-accent px-[5px] py-0.5 text-[9px] font-medium text-foreground">
            {dayDifference > 0 ? `+${dayDifference} 天` : `${dayDifference} 天`}
          </span>
        )}
        <span
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-accent/60 px-2 py-1 text-[10px] leading-none font-medium text-foreground"
          title={`当地时间 ${part.range}`}
        >
          {daylight ? (
            <Sun size={12} className="text-day-icon" aria-hidden="true" />
          ) : (
            <Moon size={12} aria-hidden="true" />
          )}
          {part.name}
        </span>
      </div>
      <div className="relative mx-px mb-4 h-[43px] has-[>input:focus-visible]:rounded has-[>input:focus-visible]:outline-2 has-[>input:focus-visible]:outline-offset-4 has-[>input:focus-visible]:outline-ring [&>input]:absolute [&>input]:-top-[7px] [&>input]:left-0 [&>input]:z-3 [&>input]:m-0 [&>input]:h-[38px] [&>input]:w-full [&>input]:cursor-ew-resize [&>input]:touch-pan-y [&>input]:opacity-0">
        <div
          className="absolute inset-x-0 top-0 flex h-6 overflow-visible rounded [&>span]:relative [&>span]:min-w-0 [&>span]:flex-1 [&>span:first-child]:rounded-l [&>span:last-child]:rounded-r [&_em]:absolute [&_em]:top-[31px] [&_em]:left-0 [&_em]:text-[9px] [&_em]:text-muted-foreground [&_em]:not-italic [&_em]:tabular-nums"
          aria-hidden="true"
        >
          {ticks.map((tick, index) => (
            <span
              className={tick.daytime ? 'bg-ruler-day' : 'bg-ruler-night'}
              key={`${tick.hour}-${tick.offset}`}
            >
              {index > 0 && (
                <i className="absolute inset-y-0 left-0 w-px bg-background/45 after:absolute after:inset-x-0 after:bottom-0 after:h-[5px] after:bg-ruler-tick" />
              )}
              {index % 6 === 0 && <em>{String(tick.hour).padStart(2, '0')}</em>}
            </span>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max={totalMinutes - 1}
          step="5"
          value={Math.min(totalMinutes - 1, Math.floor(elapsed))}
          aria-label={`调整${info.city}时间`}
          aria-valuetext={`${timeText(time)}，UTC${time.offset}`}
          onChange={(event) =>
            onSlide(start.add({ minutes: Number(event.target.value) }).toInstant(), id)
          }
        />
        <m.div
          initial={false}
          animate={{ left: `${Math.min(100, (elapsed / (totalMinutes - 1)) * 100)}%` }}
          transition={
            animateRuler && !reducedMotion
              ? { type: 'spring', stiffness: 160, damping: 26, mass: 0.8 }
              : { duration: 0 }
          }
          className="pointer-events-none absolute -top-1 z-2 h-[30px] border-l-2 border-marker shadow-[0_0_0_1px_var(--card)] [&>span]:absolute [&>span]:-top-px [&>span]:-left-1 [&>span]:block [&>span]:size-1.5 [&>span]:rounded-full [&>span]:bg-marker [&>span]:ring-2 [&>span]:ring-card"
          aria-hidden="true"
        >
          <span />
        </m.div>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-[10px] tracking-[0.2px] text-muted-foreground group-data-[night=true]/card:border-border [&>span:first-child]:text-muted-foreground [&>span:first-child]:tabular-nums [&>span:last-child]:text-[10px] max-[700px]:text-[9px] max-[700px]:[&>span:last-child]:text-[9px] max-[480px]:text-[11px] max-[480px]:[&>span:last-child]:text-[10px]">
        <span>{offsetText(time.offsetNanoseconds / 60e9)}</span>
        <span>{isBase ? '当前换算基准' : difference}</span>
      </div>
    </m.article>
  )
}
