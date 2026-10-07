import { useI18n } from '@/lib/i18n'
import { useState, type ComponentProps, type KeyboardEvent } from 'react'
import { Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const twoDigits = (length: number) =>
  Array.from({ length }, (_, index) => String(index).padStart(2, '0'))
const hours = twoDigits(24)
const minutes = twoDigits(60)

type Props = Pick<ComponentProps<'input'>, 'id' | 'className' | 'autoFocus'> & {
  value: string
  onChange: (value: string) => void
  label: string
}

export function TimePicker({ value, onChange, label, className, ...props }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [hour = '', minute = ''] = value.split(':')

  return (
    // 弹窗的滚动锁会拦截 Portal 内容的滚轮，modal 让 Popover 接管滚动锁，列表才能滚动
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            {...props}
            type="time"
            required
            step="60"
            className={cn('pr-11 [&::-webkit-calendar-picker-indicator]:hidden', className)}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute inset-y-0 right-1.5 my-auto text-muted-foreground"
              aria-label={label}
            >
              <Clock3 />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="end" className="flex w-auto gap-1 p-1" aria-label={label}>
        <TimeColumn
          label={t.hour}
          options={hours}
          value={hour}
          onSelect={(next) => onChange(`${next}:${minute || '00'}`)}
        />
        <TimeColumn
          label={t.minute}
          options={minutes}
          value={minute}
          onSelect={(next) => {
            onChange(`${hour || '00'}:${next}`)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

type ColumnProps = {
  label: string
  options: string[]
  value: string
  onSelect: (value: string) => void
}

function TimeColumn({ label, options, value, onSelect }: ColumnProps) {
  const active = value || options[0]

  return (
    <div
      ref={centerSelected}
      role="listbox"
      aria-label={label}
      className="relative flex h-56 w-14 flex-col gap-0.5 overflow-y-auto p-0.5 [scrollbar-width:none]"
      onKeyDown={moveFocus}
    >
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          role="option"
          aria-selected={option === value}
          tabIndex={option === active ? 0 : -1}
          variant={option === value ? 'default' : 'ghost'}
          size="sm"
          className="shrink-0 font-normal tabular-nums"
          onClick={() => onSelect(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  )
}

// 打开时把选中项滚动到列中间
const centerSelected = (list: HTMLElement | null) => {
  const item = list?.querySelector<HTMLElement>('[aria-selected=true]')
  if (list && item) list.scrollTop = item.offsetTop - (list.clientHeight - item.offsetHeight) / 2
}

// 每列只有选中项在 Tab 顺序中，上下方向键在列内移动焦点
function moveFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  const item = event.target as HTMLElement
  const next = event.key === 'ArrowDown' ? item.nextElementSibling : item.previousElementSibling
  if (next instanceof HTMLElement) next.focus()
}
