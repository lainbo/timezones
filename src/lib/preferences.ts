import { defaultZones, isValidZone } from './timezones'

export type Preferences = { zones: string[]; base: string; hour12: boolean }
const key = 'same-moment.preferences.v1'
export function readPreferences(): Preferences {
  const defaults = { zones: defaultZones, base: 'Asia/Singapore', hour12: false }
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!saved || !Array.isArray(saved.zones)) return defaults
    const zones = [...new Set<string>(saved.zones.filter(isValidZone))]
    return {
      zones,
      base: zones.includes(saved.base) ? saved.base : (zones[0] ?? 'Asia/Singapore'),
      hour12: saved.hour12 === true,
    }
  } catch {
    return defaults
  }
}
export function savePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(key, JSON.stringify(preferences))
    return true
  } catch {
    return false
  }
}
