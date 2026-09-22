import { useEffect, useState } from 'react'
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion'
import * as m from 'framer-motion/m'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  GripVertical,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TimezoneCard } from '@/components/timezone-card'
import { TimeEditor } from '@/components/time-editor'
import { ZonePicker } from '@/components/zone-picker'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Temporal, type Instant } from '@/lib/temporal'
import { zoneInfo } from '@/lib/timezones'
import { readPreferences, savePreferences, type Preferences } from '@/lib/preferences'

function now() {
  return Temporal.Now.instant().round({ smallestUnit: 'minute', roundingMode: 'floor' })
}

export default function App() {
  const [preferences, setPreferencesState] = useState(readPreferences)
  const [instant, setInstant] = useState(now)
  const [live, setLive] = useState(true)
  const [pickerInstant, setPickerInstant] = useState<Instant | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [storageOk, setStorageOk] = useState(true)
  const [notice, setNotice] = useState('')
  const { zones, base, hour12 } = preferences
  const reference = instant.toZonedDateTimeISO(base)
  const baseInfo = zoneInfo(base)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!live) return
    const interval = window.setInterval(() => {
      const current = now()
      setInstant((previous) => (previous.equals(current) ? previous : current))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [live])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  function setPreferences(update: (current: Preferences) => Preferences) {
    const next = update(preferences)
    if (next === preferences) return
    setPreferencesState(next)
    setStorageOk(savePreferences(next))
  }
  function updateZones(next: string[]) {
    setPreferences((current) => ({
      ...current,
      zones: next,
      base: next.includes(current.base) ? current.base : (next[0] ?? 'Asia/Taipei'),
    }))
  }
  function changeTime(next: Instant, source: string) {
    setInstant(next)
    setLive(false)
    setPreferences((current) => (current.base === source ? current : { ...current, base: source }))
  }
  function changeDay(days: number) {
    const next = reference.add({ days })
    if (next.year < 1900 || next.year > 2100) return
    changeTime(next.toInstant(), base)
    if (next.hour !== reference.hour) setNotice('这一天存在夏令时跳转，已调整到有效的当地时间。')
  }
  function changeDate(date: string) {
    const days = reference.toPlainDate().until(Temporal.PlainDate.from(date)).days
    changeDay(days)
  }
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setPreferences((current) => ({
      ...current,
      zones: arrayMove(
        current.zones,
        current.zones.indexOf(String(active.id)),
        current.zones.indexOf(String(over.id)),
      ),
    }))
  }
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="mx-auto flex min-h-svh max-w-[1512px] flex-col px-16 min-[1450px]:px-[76px] max-[1100px]:px-9 max-[700px]:px-[22px]">
          <m.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex h-[92px] items-center justify-between gap-5 border-b border-border max-[1100px]:h-[90px] max-[700px]:h-[79px]"
          >
            <a
              className="flex items-center gap-[13px] text-[23px] font-[650] tracking-[1px] text-inherit no-underline [&>span:last-child]:flex [&>span:last-child]:items-center [&>span:last-child]:gap-[15px] max-[700px]:gap-2.5 max-[700px]:text-[21px]"
              href="/"
              aria-label="同刻首页"
            >
              <span className="grid h-[30px] w-7 -rotate-[8deg] grid-cols-[repeat(2,12px)] grid-rows-[repeat(2,12px)] gap-[3px] [&>span]:rounded-full [&>span]:bg-foreground [&>span:last-child]:bg-primary">
                <span />
                <span />
                <span />
              </span>
              <span>
                同刻
                <span className="border-l border-border pl-[15px] text-[11px] font-medium tracking-[2.2px] text-muted-foreground max-[700px]:hidden">
                  TIMEZONES
                </span>
              </span>
            </a>
            <div className="flex items-center gap-[18px] max-[700px]:gap-2">
              <div
                className="flex gap-0.5 rounded-lg bg-muted p-1 [&>button]:rounded-[5px] [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-2.5 [&>button]:py-1.5 [&>button]:text-xs [&>button]:text-muted-foreground [&>button[aria-pressed=true]]:bg-card [&>button[aria-pressed=true]]:text-foreground [&>button[aria-pressed=true]]:shadow-sm max-[700px]:[&>button]:px-[7px] max-[700px]:[&>button]:py-[5px] max-[700px]:[&>button]:text-[10px]"
                aria-label="时间显示格式"
              >
                <button
                  className="rounded-md!"
                  aria-pressed={!hour12}
                  onClick={() => setPreferences((current) => ({ ...current, hour12: false }))}
                >
                  24 小时
                </button>
                <button
                  className="rounded-md!"
                  aria-pressed={hour12}
                  onClick={() => setPreferences((current) => ({ ...current, hour12: true }))}
                >
                  12 小时
                </button>
              </div>
              <ThemeSwitcher />
            </div>
          </m.header>
          <m.main
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 pt-8 max-[700px]:pt-6"
          >
            <section
              className="flex min-h-[66px] flex-wrap items-center gap-[18px] rounded-xl border border-border bg-secondary px-4 py-2.5 max-[700px]:justify-between max-[700px]:gap-2 max-[700px]:rounded-[10px] max-[700px]:px-2.5 max-[700px]:py-[11px] max-[480px]:grid max-[480px]:grid-cols-[1fr_auto] max-[480px]:gap-y-[7px]"
              aria-label="换算设置"
            >
              <div className="flex items-center gap-[13px] max-[700px]:gap-[7px] max-[480px]:justify-start">
                <span className="text-xs text-muted-foreground max-[700px]:text-[11px]">
                  换算基准
                </span>
                <Select
                  value={base}
                  onValueChange={(value) =>
                    setPreferences((current) => ({ ...current, base: value }))
                  }
                >
                  <SelectTrigger
                    aria-label="选择换算基准城市"
                    className="h-8 min-w-24 border-0 bg-transparent px-1 py-0 text-[13px] text-foreground shadow-none max-[700px]:min-w-[70px] max-[700px]:text-xs max-[480px]:min-w-[95px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(zones.length ? zones : ['Asia/Taipei']).map((id) => (
                      <SelectItem key={id} value={id}>
                        {zoneInfo(id).city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="h-[22px] w-px bg-border max-[700px]:hidden" />
              <div className="flex items-center gap-2 max-[700px]:gap-0 max-[480px]:col-start-1 max-[480px]:row-start-2 max-[480px]:-ml-[3px] max-[480px]:justify-between">
                <button
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground max-[700px]:w-[22px]"
                  aria-label="前一天"
                  onClick={() => changeDay(-1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <DatePicker
                  className="flex h-auto w-auto items-center gap-2.5 border-0 bg-transparent p-1.5 text-xs font-normal tracking-[0.3px] text-foreground tabular-nums shadow-none hover:bg-transparent hover:text-primary has-[>svg]:px-1.5 max-[700px]:gap-1.5 max-[700px]:text-[11px] max-[700px]:[&>svg]:size-[13px]"
                  label="设置基准日期"
                  value={reference.toPlainDate().toString()}
                  timeZone={base}
                  onChange={changeDate}
                />
                <button
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground max-[700px]:w-[22px]"
                  aria-label="后一天"
                  onClick={() => changeDay(1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
              <span className="ml-auto flex items-center gap-[7px] text-[11px] text-muted-foreground max-[1100px]:hidden">
                <span className="size-1 rounded-full bg-muted-foreground" />
                {live ? '正在显示当前时间' : `正在以「${baseInfo.city}」为基准预览`}
              </span>
              <Button
                variant="outline"
                className="h-8 border-border bg-card px-[11px] py-0 text-xs text-muted-foreground shadow-none has-[>svg]:px-[11px] max-[1100px]:ml-auto max-[700px]:ml-0 max-[700px]:h-7 max-[700px]:text-[11px] max-[480px]:col-start-2 max-[480px]:row-span-2 max-[480px]:row-start-1 max-[480px]:h-[33px]"
                onClick={() => {
                  setInstant(now())
                  setLive(true)
                  setNotice('已回到当前时间')
                }}
              >
                <RotateCcw size={14} />
                回到现在
              </Button>
            </section>
            <section className="mt-[35px] max-[700px]:mt-7" aria-label="世界时区">
              {zones.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                  accessibility={{
                    screenReaderInstructions: {
                      draggable:
                        '按空格键开始拖拽，使用方向键移动卡片，再按空格键放下，按 Escape 取消。',
                    },
                    announcements: {
                      onDragStart: ({ active }) => `正在移动${zoneInfo(String(active.id)).city}。`,
                      onDragOver: ({ over }) =>
                        over ? `移动到${zoneInfo(String(over.id)).city}的位置。` : '移动中。',
                      onDragEnd: ({ active, over }) =>
                        over ? `${zoneInfo(String(active.id)).city}已放下。` : '排序未改变。',
                      onDragCancel: () => '已取消排序。',
                    },
                  }}
                >
                  <SortableContext items={zones} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 items-stretch gap-[18px] xl:grid-cols-4 max-[1100px]:grid-cols-2 max-[700px]:gap-[13px] max-[480px]:grid-cols-1">
                      {zones.map((id) => (
                        <TimezoneCard
                          key={id}
                          id={id}
                          instant={instant}
                          base={base}
                          hour12={hour12}
                          animateRuler={live}
                          onEdit={setEditing}
                          onRemove={(removed) =>
                            updateZones(zones.filter((zone) => zone !== removed))
                          }
                          onSlide={changeTime}
                        />
                      ))}
                      <button
                        className="flex min-h-[298px] flex-col items-center justify-center gap-[15px] rounded-[15px] border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors duration-200 hover:border-selected-border hover:bg-accent [&>span:nth-child(2)]:text-xs min-[1450px]:min-h-[315px] max-[1100px]:min-h-[304px] max-[700px]:min-h-[280px] max-[480px]:min-h-40 max-[480px]:gap-2.5"
                        onClick={() => setPickerInstant(instant)}
                      >
                        <span className="mb-[3px] flex size-[46px] items-center justify-center rounded-full border border-border bg-accent text-muted-foreground max-[480px]:size-9">
                          <Plus size={23} strokeWidth={1.5} />
                        </span>
                        <span>下一个，你关心的时区</span>
                        <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          添加城市，与世界保持同步
                          <ArrowRight size={14} />
                        </span>
                      </button>
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-5 py-[65px] text-center text-muted-foreground [&>svg]:m-auto [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-[21px] [&_h2]:text-foreground [&_p]:mb-6 [&_p]:text-[13px]">
                  <Globe2 size={46} strokeWidth={1} />
                  <h2>你的世界，从一个城市开始</h2>
                  <p>添加常用时区，随时查看与换算当地时间。</p>
                  <Button onClick={() => setPickerInstant(instant)}>
                    <Plus size={16} />
                    添加第一个时区
                  </Button>
                </div>
              )}
            </section>
            <div className="mt-[23px] mb-[53px] flex items-center justify-between gap-[15px] text-[11px] text-muted-foreground [&>div]:flex [&>div]:items-center [&>div]:gap-2 max-[700px]:mb-[35px] max-[700px]:text-[10px] max-[700px]:leading-[1.7]">
              <div>
                <Clock3 size={16} />
                <span>点击大号时间精确换算，也可以拖动卡片下方的时间刻度。</span>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-[10px] [&>i]:ml-1.5 [&>i]:size-[7px] [&>i]:rounded-[2px] max-[700px]:hidden">
                <i className="border border-input bg-ruler-day" />
                白天
                <i className="bg-ruler-night" />
                夜晚
              </span>
            </div>
          </m.main>
          <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-border pt-[25px] pb-[27px] text-[10px] tracking-[0.1px] text-muted-foreground [&>div]:flex [&>div]:items-center [&>div]:gap-3 max-[700px]:gap-[13px] max-[700px]:py-5 max-[700px]:text-[9px] max-[700px]:[&>div]:gap-2 max-[700px]:[&>span:last-child]:ml-auto">
            <div>
              <span className="text-[13px] font-semibold tracking-[1px] text-muted-foreground">
                同刻
              </span>
              <span>不同的时区，同一个此刻。</span>
            </div>
            <span className="flex items-center gap-[5px] max-[700px]:order-3 max-[700px]:w-full">
              {storageOk ? <Check size={13} /> : null}
              {storageOk ? '时区与顺序已保存在此浏览器' : '浏览器未允许保存，当前设置仅本次有效'}
            </span>
            <span>
              自动处理夏令时<span className="px-2">·</span>以{baseInfo.city}为基准
            </span>
          </footer>
          {pickerInstant && (
            <ZonePicker
              selected={zones}
              instant={pickerInstant}
              onClose={() => setPickerInstant(null)}
              onSave={(next) => {
                updateZones(next)
                setPickerInstant(null)
              }}
            />
          )}
          {editing && (
            <TimeEditor
              zone={editing}
              instant={instant}
              onClose={() => setEditing(null)}
              onSave={(next, source) => {
                changeTime(next, source)
                setEditing(null)
              }}
            />
          )}
          {notice && (
            <div
              className="fixed bottom-[30px] left-1/2 z-80 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-[10px] border border-border bg-card px-[18px] py-3 text-xs text-foreground shadow-lg"
              role="status"
            >
              <Check size={16} />
              {notice}
            </div>
          )}
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
