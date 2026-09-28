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
import { LanguageSwitcher } from '@/components/language-switcher'
import { useI18n } from '@/lib/i18n'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Temporal, type Instant } from '@/lib/temporal'
import { zoneInfo } from '@/lib/timezones'
import { readPreferences, savePreferences, type Preferences } from '@/lib/preferences'

function now() {
  return Temporal.Now.instant().round({ smallestUnit: 'minute', roundingMode: 'floor' })
}

export default function App() {
  const { locale, t, languageStorageOk } = useI18n()
  const [preferences, setPreferencesState] = useState(readPreferences)
  const [instant, setInstant] = useState(now)
  const [live, setLive] = useState(true)
  const [pickerInstant, setPickerInstant] = useState<Instant | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [storageOk, setStorageOk] = useState(true)
  const [notice, setNotice] = useState<'adjustedDate' | 'returnedToNow' | null>(null)
  const { zones, base, hour12 } = preferences
  const reference = instant.toZonedDateTimeISO(base)
  const baseInfo = zoneInfo(base, locale)
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
    const timeout = window.setTimeout(() => setNotice(null), 4500)
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
      base: next.includes(current.base) ? current.base : (next[0] ?? 'Asia/Singapore'),
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
    if (!next.toPlainDateTime().equals(reference.toPlainDateTime().add({ days })))
      setNotice('adjustedDate')
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
            className="flex min-h-[92px] flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-border py-4 max-[700px]:min-h-[79px] max-[480px]:gap-x-2.5"
          >
            <a
              className="flex min-w-0 items-center gap-[13px] text-[23px] font-medium tracking-[1px] text-inherit no-underline [&>span:last-child]:flex [&>span:last-child]:items-center [&>span:last-child]:gap-[15px] max-[700px]:gap-2.5 max-[700px]:text-[21px] max-[480px]:gap-2 max-[480px]:text-[18px] max-[480px]:tracking-normal"
              href="/"
              aria-label={t.home}
            >
              <span className="grid h-[30px] w-7 shrink-0 -rotate-[8deg] grid-cols-[repeat(2,12px)] grid-rows-[repeat(2,12px)] gap-[3px] [&>span]:rounded-full [&>span]:bg-foreground [&>span:last-child]:bg-primary">
                <span />
                <span />
                <span />
              </span>
              <span>
                {t.appName}
                <span className="border-l border-border pl-[15px] text-[11px] font-medium tracking-[2.2px] text-muted-foreground max-[700px]:hidden">
                  TIMEZONES
                </span>
              </span>
            </a>
            <div className="ml-auto flex shrink-0 items-center gap-3 max-[700px]:gap-2 max-[480px]:gap-1.5">
              <div
                className="flex gap-0.5 rounded-lg bg-muted p-1 [&>button]:rounded-[5px] [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-2.5 [&>button]:py-1.5 [&>button]:text-xs [&>button]:text-muted-foreground [&>button[aria-pressed=true]]:bg-card [&>button[aria-pressed=true]]:text-foreground [&>button[aria-pressed=true]]:shadow-sm max-[700px]:[&>button]:px-[7px] max-[700px]:[&>button]:py-[5px] max-[700px]:[&>button]:text-[10px] max-[480px]:[&>button]:px-1.5 max-[480px]:[&>button>span:first-child]:hidden min-[480px]:[&>button>span:last-child]:hidden"
                aria-label={t.timeFormat}
              >
                <button
                  className="rounded-md!"
                  aria-pressed={!hour12}
                  onClick={() => setPreferences((current) => ({ ...current, hour12: false }))}
                >
                  <span>{t.hour24}</span>
                  <span>{t.hour24Short}</span>
                </button>
                <button
                  className="rounded-md!"
                  aria-pressed={hour12}
                  onClick={() => setPreferences((current) => ({ ...current, hour12: true }))}
                >
                  <span>{t.hour12}</span>
                  <span>{t.hour12Short}</span>
                </button>
              </div>
              <LanguageSwitcher />
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
              aria-label={t.settings}
            >
              <div className="flex min-w-0 items-center gap-[13px] max-[700px]:gap-[7px] max-[480px]:col-span-2">
                <span className="shrink-0 text-xs text-muted-foreground max-[700px]:text-[11px]">
                  {t.base}
                </span>
                <Select
                  value={base}
                  onValueChange={(value) =>
                    setPreferences((current) => ({ ...current, base: value }))
                  }
                >
                  <SelectTrigger
                    aria-label={t.selectBase}
                    className="h-8 min-w-0 max-w-56 flex-1 border-0 bg-transparent px-1 py-0 text-[13px] text-foreground shadow-none max-[700px]:text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(zones.length ? zones : ['Asia/Singapore']).map((id) => (
                      <SelectItem key={id} value={id}>
                        {zoneInfo(id, locale).city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="h-[22px] w-px bg-border max-[700px]:hidden" />
              <div className="flex items-center gap-2 max-[700px]:gap-0 max-[480px]:col-start-1 max-[480px]:row-start-2 max-[480px]:-ml-[3px] max-[480px]:justify-between">
                <button
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground max-[700px]:w-[22px]"
                  aria-label={t.previousDay}
                  onClick={() => changeDay(-1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <DatePicker
                  className="flex h-auto w-auto items-center gap-2.5 border-0 bg-transparent p-1.5 text-xs font-normal tracking-[0.3px] text-foreground tabular-nums shadow-none hover:bg-transparent hover:text-primary has-[>svg]:px-1.5 max-[700px]:gap-1.5 max-[700px]:text-[11px] max-[700px]:[&>svg]:size-[13px]"
                  label={t.referenceDate}
                  value={reference.toPlainDate().toString()}
                  timeZone={base}
                  onChange={changeDate}
                />
                <button
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground max-[700px]:w-[22px]"
                  aria-label={t.nextDay}
                  onClick={() => changeDay(1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
              <span className="ml-auto flex min-w-0 flex-1 items-center gap-[7px] text-[11px] text-muted-foreground max-[1100px]:hidden">
                <span className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                {live ? t.live : t.preview(baseInfo.city)}
              </span>
              <Button
                variant="outline"
                className="h-8 border-border bg-card px-[11px] py-0 text-xs text-muted-foreground shadow-none has-[>svg]:px-[11px] max-[1100px]:ml-auto max-[700px]:ml-0 max-[700px]:h-7 max-[700px]:text-[11px] max-[480px]:col-start-2 max-[480px]:row-start-2 max-[480px]:h-[33px]"
                onClick={() => {
                  setInstant(now())
                  setLive(true)
                  setNotice('returnedToNow')
                }}
              >
                <RotateCcw size={14} />
                {t.backToNow}
              </Button>
            </section>
            <section className="mt-[35px] max-[700px]:mt-7" aria-label={t.worldZones}>
              {zones.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                  accessibility={{
                    screenReaderInstructions: {
                      draggable: t.dragInstructions,
                    },
                    announcements: {
                      onDragStart: ({ active }) =>
                        t.dragStart(zoneInfo(String(active.id), locale).city),
                      onDragOver: ({ over }) =>
                        over ? t.dragOver(zoneInfo(String(over.id), locale).city) : t.dragging,
                      onDragEnd: ({ active, over }) =>
                        over
                          ? t.dragEnd(zoneInfo(String(active.id), locale).city)
                          : t.dragUnchanged,
                      onDragCancel: () => t.dragCancel,
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
                        className="flex min-h-[298px] min-w-0 flex-col items-center justify-center gap-[15px] rounded-[15px] border border-dashed border-border bg-muted/40 px-4 text-center text-muted-foreground transition-colors duration-200 hover:border-selected-border hover:bg-accent [&>span:nth-child(2)]:text-xs min-[1450px]:min-h-[315px] max-[1100px]:min-h-[304px] max-[700px]:min-h-[280px] max-[480px]:min-h-40 max-[480px]:gap-2.5"
                        onClick={() => setPickerInstant(instant)}
                      >
                        <span className="mb-[3px] flex size-[46px] items-center justify-center rounded-full border border-border bg-accent text-muted-foreground max-[480px]:size-9">
                          <Plus size={23} strokeWidth={1.5} />
                        </span>
                        <span>{t.nextZone}</span>
                        <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {t.addCity}
                          <ArrowRight size={14} />
                        </span>
                      </button>
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-5 py-[65px] text-center text-muted-foreground [&>svg]:m-auto [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-[21px] [&_h2]:text-foreground [&_p]:mb-6 [&_p]:text-[13px]">
                  <Globe2 size={46} strokeWidth={1} />
                  <h2>{t.emptyTitle}</h2>
                  <p>{t.emptyDescription}</p>
                  <Button onClick={() => setPickerInstant(instant)}>
                    <Plus size={16} />
                    {t.addFirst}
                  </Button>
                </div>
              )}
            </section>
            <div className="mt-[23px] mb-[53px] flex items-center justify-between gap-[15px] text-[11px] text-muted-foreground [&>div]:flex [&>div]:items-center [&>div]:gap-2 max-[700px]:mb-[35px] max-[700px]:text-[10px] max-[700px]:leading-[1.7]">
              <div>
                <Clock3 className="shrink-0" size={16} />
                <span>{t.usageHint}</span>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-[10px] [&>i]:ml-1.5 [&>i]:size-[7px] [&>i]:rounded-[2px] max-[700px]:hidden">
                <i className="border border-input bg-ruler-day" />
                {t.day}
                <i className="bg-ruler-night" />
                {t.night}
              </span>
            </div>
          </m.main>
          <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-border pt-[25px] pb-[27px] text-[10px] tracking-[0.1px] text-muted-foreground [&>div]:flex [&>div]:items-center [&>div]:gap-3 max-[700px]:gap-[13px] max-[700px]:py-5 max-[700px]:text-[9px] max-[700px]:[&>div]:gap-2 [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere] max-[700px]:[&>span:last-child]:ml-auto">
            <div>
              <span className="text-[13px] font-medium tracking-[1px] text-muted-foreground">
                {t.appName}
              </span>
              <span>{t.tagline}</span>
            </div>
            <span className="flex items-center gap-[5px] max-[700px]:order-3 max-[700px]:w-full">
              {storageOk && languageStorageOk ? <Check className="shrink-0" size={13} /> : null}
              {storageOk && languageStorageOk ? t.saved : t.storageUnavailable}
            </span>
            <span>
              {t.automaticDst}
              <span className="px-2">·</span>
              {t.basedOn(baseInfo.city)}
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
              {t[notice]}
            </div>
          )}
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
