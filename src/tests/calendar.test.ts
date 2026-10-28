import { describe, expect, it } from 'vitest'
import { addDays, calendarMonth, dateKey } from '../utils/calendar'

describe('calendar months', () => {
  it('builds the current Gregorian month', () => {
    const month = calendarMonth(new Date(2026, 9, 27, 12), 'en')
    expect(dateKey(month.start)).toBe('2026-10-01')
    expect(month.days).toBe(31)
  })
  it('builds a real Persian month, with Saturday as its first weekday', () => {
    const month = calendarMonth(new Date(2026, 9, 27, 12), 'fa')
    expect(dateKey(month.start)).toBe('2026-10-23') // 1 Aban 1405
    expect(month.days).toBe(30)
    expect(month.weekdayOffset).toBe((month.start.getDay() + 1) % 7)
    expect(dateKey(addDays(month.start, month.days))).toBe('2026-11-22')
  })
})
