import { describe, expect, it } from 'vitest'
import { formatMoney, parseMoney } from '../utils/money'

describe('exact monetary values', () => {
  it('parses decimal strings into integer cents', () => {
    expect(parseMoney('0.10')).toBe(10)
    expect(parseMoney('100.25')).toBe(10025)
    expect(parseMoney('12')).toBe(1200)
    expect(parseMoney('1.2')).toBe(120)
  })
  it('rejects zero, negative, invalid, and overly precise amounts', () => {
    for (const invalid of ['0', '-1', '1.234', 'abc', '', '1e2', '9999999999999']) expect(parseMoney(invalid)).toBeNull()
  })
  it('formats very large integer totals without floating point rounding', () => {
    expect(formatMoney(9007199254740993n)).toBe('$90,071,992,547,409.93')
    expect(formatMoney(-50n)).toBe('−$0.50')
    expect(formatMoney(425000n - 4850n - 12600n)).toBe('$4,075.50')
  })
})
