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
import { resolveLocalTime, timeText, type Instant } from '@/lib/temporal'
import { zoneInfo } from '@/lib/timezones'

type Props = {
  zone: string
  instant: Instant
  onClose: () => void
  onSave: (instant: Instant, zone: string) => void
}
export function TimeEditor({ zone, instant, onClose, onSave }: Props) {
  const current = instant.toZonedDateTimeISO(zone)
  const info = zoneInfo(zone)
  const [date, setDate] = useState(current.toPlainDate().toString())
  const [time, setTime] = useState(timeText(current))
  const [occurrence, setOccurrence] = useState<'earlier' | 'later' | null>(null)
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
      <DialogContent className="max-w-[480px] gap-0 rounded-[18px] bg-popover p-0 pt-[29px] sm:max-w-[480px] [&_form]:px-7 [&_form]:pb-[25px] max-[700px]:[&_form]:px-[22px]">
        <DialogHeader className="px-7 text-left max-[700px]:px-[22px]">
          <div className="mb-3 flex items-center gap-[7px] text-[10px] tracking-[1.7px] text-muted-foreground">
            <Clock3 size={17} /> CONVERT TIME
          </div>
          <DialogTitle className="text-2xl font-[550] tracking-[-0.5px]">
            设置{info.city}时间
          </DialogTitle>
          <DialogDescription className="mt-[7px] text-xs leading-[1.7] text-muted-foreground">
            输入当地日期和时间，其他时区会同步换算。
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (resolution && valid) onSave(resolution[occurrence ?? 'earlier'].toInstant(), zone)
          }}
        >
          <div className="mt-[13px] flex items-center justify-between gap-2.5 border-b border-border py-3.5 text-xs text-foreground [&>span:last-child]:text-[11px] [&>span:last-child]:text-muted-foreground">
            <span>{info.city}</span>
            <span>{zone}</span>
          </div>
          <div className="my-[22px] flex gap-3.5 [&>label]:flex [&>label]:min-w-0 [&>label]:flex-1 [&>label]:flex-col [&>label]:gap-[9px] [&>label]:text-xs [&>label]:text-muted-foreground">
            <div className="flex min-w-0 flex-1 flex-col gap-[9px] text-xs text-muted-foreground [&>button]:h-[43px] [&>button]:justify-between [&>button]:bg-card [&>button]:px-2.5 [&>button]:py-0 [&>button]:text-sm [&>button]:text-foreground [&>button]:shadow-none">
              <label htmlFor="local-date">当地日期</label>
              <DatePicker
                id="local-date"
                label="选择当地日期"
                timeZone={zone}
                value={date}
                onChange={(value) => {
                  setDate(value)
                  setOccurrence(null)
                }}
              />
            </div>
            <label>
              当地时间（24 小时制）
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
                这段当地时间因夏令时跳转而不存在。请改选 {timeText(resolution.later)}{' '}
                或其他有效时间。
              </p>
            </div>
          )}
          {resolution?.kind === 'overlap' && (
            <fieldset className="border-0 p-0 text-xs text-muted-foreground [&_legend]:mb-2.5 [&_legend]:text-xs [&_label]:mt-2 [&_label]:flex [&_label]:items-center [&_label]:gap-2 [&_label]:rounded-[7px] [&_label]:border [&_label]:border-border [&_label]:p-2.5 [&_label>span]:ml-auto [&_label>span]:tabular-nums [&_input]:accent-selected-foreground">
              <legend>夏令时结束，这个时间出现两次，请选择：</legend>
              {(['earlier', 'later'] as const).map((choice, index) => (
                <label key={choice}>
                  <input
                    type="radio"
                    name="occurrence"
                    checked={occurrence === choice}
                    onChange={() => setOccurrence(choice)}
                  />
                  第 {index + 1} 次<span>UTC{resolution[choice].offset}</span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="mt-[26px] flex justify-end gap-2.5 [&_button]:text-xs">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={!valid}>
              换算时间
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
