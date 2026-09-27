import { useI18n } from '@/lib/i18n'
import { useState } from 'react'
import { ArrowRight, Clock3, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/date-picker'
import { dateText, offsetText, resolveLocalTime, timeText, type Instant } from '@/lib/temporal'
import { zoneInfo } from '@/lib/timezones'

type Props = {
  zone: string
  instant: Instant
  onClose: () => void
  onSave: (instant: Instant, zone: string) => void
}
export function TimeEditor({ zone, instant, onClose, onSave }: Props) {
  const { locale, t } = useI18n()
  const current = instant.toZonedDateTimeISO(zone)
  const info = zoneInfo(zone, locale)
  const [date, setDate] = useState(current.toPlainDate().toString())
  const [time, setTime] = useState(timeText(current))
  const [occurrence, setOccurrence] = useState<'earlier' | 'later' | null>(() => {
    const initial = resolveLocalTime(zone, current.toPlainDate().toString(), timeText(current))
    if (initial.kind !== 'overlap') return null
    return initial.later.offsetNanoseconds === current.offsetNanoseconds ? 'later' : 'earlier'
  })
  let resolution: ReturnType<typeof resolveLocalTime> | null = null
  try {
    if (date && time) resolution = resolveLocalTime(zone, date, time)
  } catch {
    /* 输入尚未组成有效日期时，保留用户正在编辑的内容。 */
  }
  const valid =
    resolution && resolution.kind !== 'gap' && (resolution.kind !== 'overlap' || occurrence)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[480px] gap-0 overflow-y-auto rounded-[18px] bg-popover p-0 pt-[29px] sm:max-w-[480px] [&_form]:px-7 [&_form]:pb-[25px] max-[700px]:[&_form]:px-[22px]">
        <DialogHeader className="pr-12 pl-7 text-left max-[700px]:pl-[22px]">
          <div className="mb-3 flex items-center gap-[7px] text-[10px] tracking-[1.7px] text-muted-foreground">
            <Clock3 size={17} /> {t.convertLabel}
          </div>
          <DialogTitle className="text-2xl leading-tight font-medium tracking-[-0.5px] [overflow-wrap:anywhere]">
            {t.setTime(info.city)}
          </DialogTitle>
          <DialogDescription className="mt-[7px] text-xs leading-[1.7] text-muted-foreground">
            {t.editorHint}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (resolution && valid) onSave(resolution[occurrence ?? 'earlier'].toInstant(), zone)
          }}
        >
          <div className="mt-[13px] flex flex-wrap items-center justify-between gap-2.5 [overflow-wrap:anywhere] border-b border-border py-3.5 text-xs text-foreground [&>span:last-child]:text-[11px] [&>span:last-child]:text-muted-foreground">
            <span>{info.city}</span>
            <span>{zone}</span>
          </div>
          <div className="my-[22px] flex flex-col gap-3.5 min-[480px]:flex-row [&>label]:flex [&>label]:min-w-0 [&>label]:flex-1 [&>label]:flex-col [&>label]:gap-[9px] [&>label]:text-xs [&>label]:text-muted-foreground">
            <div className="flex min-w-0 flex-1 flex-col gap-[9px] text-xs text-muted-foreground [&>button]:h-[43px] [&>button]:justify-between [&>button]:bg-card [&>button]:px-2.5 [&>button]:py-0 [&>button]:text-sm [&>button]:text-foreground [&>button]:shadow-none">
              <label htmlFor="local-date">{t.localDate}</label>
              <DatePicker
                id="local-date"
                label={t.chooseLocalDate}
                timeZone={zone}
                value={date}
                onChange={(value) => {
                  setDate(value)
                  setOccurrence(null)
                }}
              />
            </div>
            <label>
              {t.localTime}
              <Input
                className="h-[43px] min-w-0 bg-card px-2.5 py-0 text-sm text-foreground"
                autoFocus
                type="time"
                required
                step="60"
                value={time}
                onChange={(event) => {
                  setTime(event.target.value)
                  setOccurrence(null)
                }}
              />
            </label>
          </div>
          {resolution?.kind === 'gap' && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-warning-border bg-warning p-3 text-xs leading-[1.6] text-muted-foreground [&>svg]:mt-0.5 [&>svg]:shrink-0 [&>p]:m-0"
              role="alert"
            >
              <Info size={18} />
              <p>
                {t.gap(
                  `${!resolution.later.toPlainDate().equals(date) ? `${dateText(resolution.later, locale)} ` : ''}${timeText(resolution.later)}`,
                )}
              </p>
            </div>
          )}
          {resolution?.kind === 'overlap' && (
            <fieldset className="border-0 p-0 text-xs text-muted-foreground [&_legend]:mb-2.5 [&_legend]:text-xs [&_label]:mt-2 [&_label]:flex [&_label]:items-center [&_label]:gap-2 [&_label]:rounded-[7px] [&_label]:border [&_label]:border-border [&_label]:p-2.5 [&_label>span]:ml-auto [&_label>span]:tabular-nums [&_input]:accent-selected-foreground">
              <legend>{t.overlap}</legend>
              {(['earlier', 'later'] as const).map((choice, index) => (
                <label key={choice}>
                  <input
                    type="radio"
                    name="occurrence"
                    checked={occurrence === choice}
                    onChange={() => setOccurrence(choice)}
                  />
                  {t.occurrence(index)}
                  <span>{offsetText(resolution[choice].offsetNanoseconds / 60e9)}</span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="mt-[26px] flex justify-end gap-2.5 [&_button]:text-xs">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={!valid}>
              {t.convertTime}
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
