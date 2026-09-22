export const Temporal = globalThis.Temporal
export type Instant = globalThis.Temporal.Instant
export type ZonedDateTime = globalThis.Temporal.ZonedDateTime

export function resolveLocalTime(zone: string, date: string, time: string) {
  const plain = Temporal.PlainDateTime.from(`${date}T${time}`)
  const earlier = plain.toZonedDateTime(zone, { disambiguation: 'earlier' })
  const later = plain.toZonedDateTime(zone, { disambiguation: 'later' })
  if (!earlier.toPlainDateTime().equals(plain) || !later.toPlainDateTime().equals(plain)) {
    return { kind: 'gap' as const, earlier, later }
  }
  return { kind: earlier.equals(later) ? ('exact' as const) : ('overlap' as const), earlier, later }
}

export function timeText(time: ZonedDateTime, hour12 = false) {
  return `${String(hour12 ? time.hour % 12 || 12 : time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
}

export function dateText(time: ZonedDateTime) {
  return time
    .toPlainDate()
    .toLocaleString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
}

export function offsetText(minutes: number) {
  const absolute = Math.abs(minutes)
  const hours = Math.floor(absolute / 60)
  const rest = Math.round(absolute % 60)
  return `UTC${minutes < 0 ? '−' : '+'}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`
}
