import { lazy, Suspense, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { zhCN } from 'react-day-picker/locale'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Temporal } from '@/lib/temporal'

const Calendar = lazy(() =>
  import('@/components/ui/calendar').then((module) => ({ default: module.Calendar })),
)
const startMonth = new Date('1900-01-01T00:00:00Z')
const endMonth = new Date('2100-12-01T00:00:00Z')

type Props = {
  value: string
  timeZone: string
  onChange: (value: string) => void
  label: string
  id?: string
  className?: string
}

export function DatePicker({ value, timeZone, onChange, label, id, className }: Props) {
  const [open, setOpen] = useState(false)
  // Calendar 接收 Date；固定 UTC 传递日期，避免设备时区改变所选日历日。
  const selected = new Date(`${value}T00:00:00Z`)
  const today = new Date(`${Temporal.Now.plainDateISO(timeZone)}T00:00:00Z`)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={className}
          aria-label={`${label} ${value}`}
        >
          <CalendarDays size={16} />
          <span>{value.replaceAll('-', ' / ')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0" aria-label={label}>
        <Suspense
          fallback={
            <div
              className="flex h-80 w-72 items-center justify-center text-sm text-muted-foreground"
              role="status"
            >
              加载日历…
            </div>
          }
        >
          <Calendar
            mode="single"
            required
            selected={selected}
            defaultMonth={selected}
            today={today}
            timeZone="UTC"
            locale={zhCN}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            autoFocus
            formatters={{ formatMonthDropdown: (date) => `${date.getUTCMonth() + 1}月` }}
            labels={{
              labelPrevious: () => '上个月',
              labelNext: () => '下个月',
              labelMonthDropdown: () => '选择月份',
              labelYearDropdown: () => '选择年份',
              labelDayButton: (date, modifiers) =>
                `${date.toISOString().slice(0, 10)}${modifiers.today ? '，今天' : ''}${modifiers.selected ? '，已选择' : ''}`,
            }}
            onSelect={(date) => {
              onChange(date.toISOString().slice(0, 10))
              setOpen(false)
            }}
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  )
}
