import rawNames from '../data/timezone-names.json'
import { Temporal, offsetText, type Instant } from './temporal'

type ZoneName = { city: string; country: string }
const names: Record<string, ZoneName> = rawNames
const countries = new Intl.DisplayNames(['zh-CN'], { type: 'region' })
const aliases: Record<string, string> = {
  'America/Los_Angeles':
    '美西 美国西部 太平洋时间 旧金山 旧金山时间 san francisco pacific PT PST PDT',
  'America/New_York': '美东 美国东部 纽约时间 eastern ET EST EDT',
  'Asia/Taipei': '台湾 臺北 臺灣 taiwan',
  'Asia/Shanghai': '中国 北京 北京时间 中国标准时间 beijing china CST',
  'Asia/Tokyo': '日本 japan',
  'Europe/London': '英国 UK GMT BST',
}

export function zoneInfo(id: string) {
  const data = names[id]
  if (id === 'UTC')
    return {
      id,
      city: '协调世界时',
      english: 'Universal time',
      region: '全球标准',
      search: 'utc gmt 协调世界时 世界标准时间 格林尼治',
    }
  if (id.startsWith('Etc/GMT')) {
    const offset = -Number(id.slice(7)) * 60
    const city = offsetText(offset)
    return { id, city, english: 'Fixed offset', region: '固定偏移', search: `${city} 固定偏移` }
  }
  const city =
    data?.city ??
    new Intl.DateTimeFormat('zh-CN', { timeZone: id, timeZoneName: 'longGeneric' })
      .formatToParts(0)
      .find((part) => part.type === 'timeZoneName')?.value ??
    id
  const english = id.split('/').at(-1)!.replaceAll('_', ' ')
  const region = data?.country ? countries.of(data.country)! : '世界时区'
  return {
    id,
    city,
    english,
    region,
    search: `${city} ${region} ${id} ${english} ${aliases[id] ?? ''}`.toLowerCase(),
  }
}

// Intl 不列出 UTC 和固定偏移时区，需要在地区时区之外补齐。
export const zoneIds = [
  ...new Set([
    ...Intl.supportedValuesOf('timeZone'),
    'UTC',
    ...Array.from({ length: 26 }, (_, i) => i - 12)
      .filter((n) => n !== 0)
      .map((n) => `Etc/GMT${n > 0 ? '-' : '+'}${Math.abs(n)}`),
    'Etc/GMT-14',
  ]),
]
export const zones = zoneIds.map(zoneInfo)
export const defaultZones = ['Asia/Taipei', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo']

export function catalogAt(instant: Instant) {
  return zones.map((zone) => ({
    ...zone,
    offset: instant.toZonedDateTimeISO(zone.id).offsetNanoseconds / 60e9,
  }))
}

export function parseOffsetQuery(query: string) {
  const normalized = query.toLowerCase().replaceAll('−', '-').replaceAll(' ', '')
  const match = /^(?:utc|gmt)?([+-])(\d{1,2})(?::([0-5]\d)|\.(\d+))?$/.exec(normalized)
  if (!match) return null
  const minutes =
    Number(match[2]) * 60 + (match[3] ? Number(match[3]) : Number(`0.${match[4] ?? 0}`) * 60)
  return Math.round(minutes * (match[1] === '-' ? -1 : 1))
}

export function matchesZone(zone: ReturnType<typeof catalogAt>[number], query: string) {
  const trimmed = query.trim().toLowerCase()
  const offset = parseOffsetQuery(trimmed)
  if (offset !== null) return zone.offset === offset
  return trimmed
    .split(/\s+/)
    .every(
      (term) => zone.search.includes(term) || offsetText(zone.offset).toLowerCase().includes(term),
    )
}

export function isValidZone(id: unknown): id is string {
  if (typeof id !== 'string') return false
  try {
    Temporal.Now.instant().toZonedDateTimeISO(id)
    return true
  } catch {
    return false
  }
}
