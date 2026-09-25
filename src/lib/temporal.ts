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
  // Chrome 用 zh-CN 格式化 Temporal 日期时会忽略 month: 'long' 并输出 11/1，因此直接拼接日期字段。
  return `${time.month}月${time.day}日周${'一二三四五六日'[time.dayOfWeek - 1]}`
}

export function offsetText(minutes: number) {
  const offset = Temporal.Duration.from({ nanoseconds: Math.round(minutes * 60e9) }).round({
    largestUnit: 'hour',
    smallestUnit: 'minute',
  })
  const rest = Math.abs(offset.minutes)
  return `UTC${offset.sign < 0 ? '−' : '+'}${Math.abs(offset.hours)}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`
}
