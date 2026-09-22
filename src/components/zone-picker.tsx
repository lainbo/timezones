import { useMemo, useState } from 'react'
import { Check, Globe2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { catalogAt, matchesZone, zoneInfo } from '@/lib/timezones'
import { offsetText, type Instant } from '@/lib/temporal'

type Props = {
  selected: string[]
  instant: Instant
  onClose: () => void
  onSave: (zones: string[]) => void
}

export function ZonePicker({ selected, instant, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(selected)
  const [query, setQuery] = useState('')
  const catalog = useMemo(() => {
    const rows = catalogAt(instant)
    for (const id of selected) {
      if (!rows.some((row) => row.id === id))
        rows.push({
          ...zoneInfo(id),
          offset: instant.toZonedDateTimeISO(id).offsetNanoseconds / 60e9,
        })
    }
    return rows.sort(
      (a, b) =>
        a.offset - b.offset || a.city.localeCompare(b.city, 'zh-CN') || a.id.localeCompare(b.id),
    )
  }, [instant, selected])
  const selectedSet = new Set(selected)
  const draftSet = new Set(draft)
  const filtered = catalog.filter((zone) => matchesZone(zone, query))
  const pinned = selected
    .map((id) => filtered.find((zone) => zone.id === id))
    .filter((zone) => zone !== undefined)
  const remaining = filtered.filter((zone) => !selectedSet.has(zone.id))
  function toggle(id: string, checked: boolean) {
    setDraft((current) => (checked ? [...current, id] : current.filter((value) => value !== id)))
  }
  function renderRows(rows: typeof catalog) {
    return rows.map((zone) => (
      <label
        className="flex min-h-[54px] min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 [content-visibility:auto] [contain-intrinsic-size:auto_36px] data-[selected=false]:hover:bg-accent/50 data-[selected=true]:bg-selected"
        key={zone.id}
        data-selected={draftSet.has(zone.id)}
      >
        <Checkbox
          checked={draftSet.has(zone.id)}
          onCheckedChange={(checked) => toggle(zone.id, checked === true)}
          aria-label={`${zone.city} ${zone.id}`}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 text-[13px] leading-[18px] text-foreground [&>span]:text-[11px] [&>span]:text-muted-foreground">
            {zone.city}
            <span>{zone.region}</span>
          </span>
          <span className="text-[11px] leading-4 text-muted-foreground [overflow-wrap:anywhere]">
            {zone.id}
          </span>
        </span>
        <span className="ml-auto shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {offsetText(zone.offset)}
        </span>
      </label>
    ))
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="w-[calc(100vw-32px)] max-w-[760px] gap-0 overflow-hidden rounded-[18px] border-border bg-popover p-0 pt-7 shadow-2xl sm:max-w-[760px]"
        aria-describedby="zone-description"
      >
        <DialogHeader className="px-7 text-left max-[700px]:px-[22px]">
          <div className="mb-3 flex items-center gap-[7px] text-[10px] tracking-[1.7px] text-muted-foreground">
            <Globe2 size={17} /> YOUR WORLD
          </div>
          <DialogTitle className="text-2xl font-[550] tracking-[-0.5px]">添加时区</DialogTitle>
          <DialogDescription
            className="mt-[7px] text-xs leading-[1.7] text-muted-foreground"
            id="zone-description"
          >
            选择你关心的城市，让世界的时间同步呈现。
          </DialogDescription>
        </DialogHeader>
        <div className="mx-6 mt-[23px] mb-[15px] flex shrink-0 items-center gap-[9px] rounded-lg border border-border bg-card px-3 text-muted-foreground focus-within:border-selected-border focus-within:ring-3 focus-within:ring-ring/15 [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-[5px] [&>button]:text-muted-foreground">
          <Search size={18} />
          <Input
            className="h-[42px] border-0 pl-0 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-xs dark:bg-transparent"
            autoFocus
            aria-label="搜索时区"
            placeholder="搜索城市、时区或 UTC 偏移，如 台北 / +8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="h-[min(430px,calc(100dvh-330px))] min-h-[150px] overflow-y-auto overscroll-contain px-3 [scrollbar-width:thin] [scrollbar-color:var(--input)_transparent]">
          {pinned.length > 0 && (
            <>
              <div className="flex justify-between bg-popover px-[13px] pt-[13px] pb-[9px] text-[11px] text-muted-foreground [&>span:last-child]:text-[10px]">
                <span>已添加的时区</span>
                <span>{pinned.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">{renderRows(pinned)}</div>
            </>
          )}
          {remaining.length > 0 && (
            <>
              <div className="flex justify-between bg-popover px-[13px] pt-[13px] pb-[9px] text-[11px] text-muted-foreground [&>span:last-child]:text-[10px]">
                <span>{query ? '搜索结果' : '全部时区'}</span>
                <span>按 UTC 偏移排序</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">{renderRows(remaining)}</div>
            </>
          )}
          {filtered.length === 0 && (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3.5 text-muted-foreground [&>strong]:text-sm [&>strong]:font-medium [&>p]:m-0 [&>p]:text-xs [&_button]:mt-1 [&_button]:text-xs">
              <Search size={30} />
              <strong>没有找到这个时区</strong>
              <p>试试中文城市名、Taipei 或 +5:30</p>
              <Button variant="outline" onClick={() => setQuery('')}>
                清空搜索
              </Button>
            </div>
          )}
        </div>
        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-border px-[25px] pt-[17px] pb-[7px] text-xs text-muted-foreground [&_strong]:px-0.5 [&_strong]:font-[550] [&_strong]:text-selected-foreground [&>div]:flex [&>div]:gap-1.5 [&_button]:text-xs max-[480px]:px-5">
          <span>
            已选 <strong>{draft.length}</strong> 个时区
            <span className="text-[10px] text-muted-foreground max-[480px]:hidden">
              {' '}
              / {catalog.length} 个可用
            </span>
          </span>
          <div>
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button onClick={() => onSave(draft)}>
              <Check size={16} />
              完成
            </Button>
          </div>
        </div>
        <p className="m-0 px-[25px] pb-[17px] text-[10px] text-muted-foreground">
          UTC 偏移以当前查看的日期为准，自动考虑夏令时。
        </p>
      </DialogContent>
    </Dialog>
  )
}
