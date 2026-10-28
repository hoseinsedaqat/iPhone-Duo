/** Parse currency without multiplying a binary floating-point value. */
export function parseMoney(input: string): number | null {
  const match = input.trim().match(/^(\d{1,12})(?:\.(\d{1,2}))?$/)
  if (!match) return null
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}
/** Format integer cents; arithmetic stays integer and totals may exceed Number's safe range. */
export function formatMoney(cents: number | bigint, locale = 'en-US') {
  const amount = BigInt(cents)
  const abs = amount < 0n ? -amount : amount
  const whole = abs / 100n
  const fraction = (abs % 100n).toString().padStart(2, '0')
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).formatToParts(whole)
  const localizedFraction = locale.startsWith('fa') ? fraction.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]) : fraction
  return `${amount < 0n ? '−' : ''}${parts.map(part => part.type === 'fraction' ? localizedFraction : part.value).join('')}`
}
