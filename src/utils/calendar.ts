import type { Language } from '../system/types'

const persianDayFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { day: 'numeric' })
function localNoon(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12) }
export function addDays(date: Date, amount: number) { const next = localNoon(date); next.setDate(next.getDate() + amount); return next }
export function calendarMonth(anchor: Date, language: Language) {
  let start = localNoon(anchor)
  let days: number
  if (language === 'fa') {
    // Intl provides the Persian calendar conversion; scan at most a month to find its boundaries.
    for (let i = 0; i < 32 && Number(persianDayFormatter.format(start)) !== 1; i++) start = addDays(start, -1)
    days = 1
    while (days < 32 && Number(persianDayFormatter.format(addDays(start, days))) !== 1) days++
  } else {
    start = new Date(start.getFullYear(), start.getMonth(), 1, 12)
    days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  }
  return { start, days, weekdayOffset: language === 'fa' ? (start.getDay() + 1) % 7 : start.getDay() }
}
export function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
