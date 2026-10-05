import { useI18n } from '@/lib/i18n'
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
import { catalogAt, matchesZone, withOffset, zoneInfo } from '@/lib/timezones'
import { offsetText, type Instant } from '@/lib/temporal'

type Props = {
  selected: string[]
  instant: Instant
  onClose: () => void
  onSave: (zones: string[]) => void
}

export function ZonePicker({ selected, instant, onClose, onSave }: Props) {
  const { locale, t } = useI18n()
  const [draft, setDraft] = useState(selected)
  const [query, setQuery] = useState('')
  const catalog = useMemo(() => {
    const rows = catalogAt(instant, locale)
    for (const id of selected) {
      if (!rows.some((row) => row.id === id)) rows.push(withOffset(zoneInfo(id, locale), instant))
    }
    return rows.sort(
      (a, b) =>
        a.offset - b.offset || a.city.localeCompare(b.city, locale) || a.id.localeCompare(b.id),
    )
  }, [instant, selected, locale])
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
          <span className="flex flex-wrap items-center gap-x-2 text-[13px] leading-[18px] text-foreground [overflow-wrap:anywhere]">
            {zone.city}
            <span className="text-[11px] text-muted-foreground">{zone.region}</span>
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
  function renderSection(title: string, aside: string | number, rows: typeof catalog) {
    return (
      <>
        <div className="flex flex-wrap justify-between gap-2 bg-popover px-[13px] pt-[13px] pb-[9px] text-[11px] text-muted-foreground">
          <span>{title}</span>
          <span className="text-[10px]">{aside}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">{renderRows(rows)}</div>
      </>
    )
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[760px] flex-col gap-0 overflow-hidden rounded-[18px] border-border bg-popover p-0 pt-7 shadow-2xl sm:max-w-[760px]"
        aria-describedby="zone-description"
      >
        <DialogHeader className="shrink-0 pr-12 pl-7 text-left max-[700px]:pl-[22px]">
          <div className="mb-3 flex items-center gap-[7px] text-[10px] tracking-[1.7px] text-muted-foreground">
            <Globe2 size={17} /> {t.yourWorld}
          </div>
          <DialogTitle className="text-2xl font-medium tracking-[-0.5px]">{t.addZones}</DialogTitle>
          <DialogDescription
            className="mt-[7px] text-xs leading-[1.7] text-muted-foreground"
            id="zone-description"
          >
            {t.chooseCities}
          </DialogDescription>
        </DialogHeader>
        <div className="mx-6 mt-[23px] mb-[15px] flex shrink-0 items-center gap-[9px] rounded-lg border border-border bg-card px-3 text-muted-foreground focus-within:border-selected-border focus-within:ring-3 focus-within:ring-ring/15">
          <Search size={18} />
          <Input
            className="h-[42px] border-0 pl-0 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-xs dark:bg-transparent"
            autoFocus
            aria-label={t.searchZones}
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              className="border-0 bg-transparent p-[5px] text-muted-foreground"
              type="button"
              aria-label={t.clearSearch}
              onClick={() => setQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="h-[min(430px,calc(100dvh-330px))] min-h-0 flex-auto overflow-y-auto overscroll-contain px-3 [scrollbar-width:thin] [scrollbar-color:var(--input)_transparent]">
          {pinned.length > 0 && renderSection(t.addedZones, pinned.length, pinned)}
          {remaining.length > 0 &&
            renderSection(query ? t.searchResults : t.allZones, t.sortedByOffset, remaining)}
          {filtered.length === 0 && (
            <div className="flex min-h-[150px] flex-col items-center justify-center gap-3.5 text-muted-foreground">
              <Search size={30} />
              <strong className="text-sm font-medium">{t.noResults}</strong>
              <p className="m-0 text-xs">{t.searchHint}</p>
              <Button className="mt-1 text-xs" variant="outline" onClick={() => setQuery('')}>
                {t.clearSearch}
              </Button>
            </div>
          )}
        </div>
        <div className="mt-3.5 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border px-[25px] pt-[17px] pb-[7px] text-xs text-muted-foreground max-[480px]:px-5">
          <span>
            {t.selectedCount(draft.length)}
            <span className="text-[10px] text-muted-foreground max-[480px]:hidden">
              {' '}
              {t.availableCount(catalog.length)}
            </span>
          </span>
          <div className="flex gap-1.5">
            <Button className="text-xs" variant="ghost" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button className="text-xs" onClick={() => onSave(draft)}>
              <Check size={16} />
              {t.done}
            </Button>
          </div>
        </div>
        <p className="m-0 shrink-0 px-[25px] pb-[17px] text-[10px] text-muted-foreground">
          {t.offsetHint}
        </p>
      </DialogContent>
    </Dialog>
  )
}
