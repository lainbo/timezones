import { readFileSync, writeFileSync } from 'node:fs'

const read = (file) =>
  JSON.parse(readFileSync(new URL(`../node_modules/${file}`, import.meta.url), 'utf8'))
const cities = read('cldr-dates-full/main/zh/timeZoneNames.json').main.zh.dates.timeZoneNames.zone
const aliases = read('cldr-bcp47/bcp47/timezone.json').keyword.u.tz
const names = {}
function flatten(value, path = []) {
  if (value.exemplarCity) names[path.join('/')] = { city: value.exemplarCity, country: '' }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'object') flatten(child, [...path, key])
  }
}
flatten(cities)
for (const [key, value] of Object.entries(aliases)) {
  if (!value._alias || key.startsWith('_')) continue
  const ids = value._alias.split(' ')
  const source = ids.map((id) => names[id]).find(Boolean)
  if (!source) continue
  const country = (value._region || key.slice(0, 2)).toUpperCase()
  for (const id of ids) {
    names[id] = { city: source.city, country }
    // Chrome 列出的是 CLDR 规范标识符（如 Asia/Calcutta），记录 IANA 现行名称供英文名和搜索使用。
    if (value._iana && id !== value._iana) names[id].iana = value._iana
  }
}
names.UTC = { city: '协调世界时', country: '' }
writeFileSync(
  new URL('../src/data/timezone-names.json', import.meta.url),
  JSON.stringify(names, null, 2) + '\n',
)
console.log(`已生成 ${Object.keys(names).length} 个时区及别名的中文名称（Unicode CLDR 48.2）。`)
