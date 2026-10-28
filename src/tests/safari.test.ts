import { describe, expect, it } from 'vitest'
import { addressToUrl } from '../apps/Safari'

describe('simulated Safari navigation', () => {
  it('normalizes safe web addresses', () => {
    expect(addressToUrl('example.com', 'Duo Search')).toBe('https://example.com')
    expect(addressToUrl('https://example.com/path', 'Duo Search')).toBe('https://example.com/path')
    expect(addressToUrl('duo://guide', 'Duo Search')).toBe('duo://guide')
  })
  it('treats searches and unsafe protocols as text, not executable URLs', () => {
    expect(addressToUrl('hello world', 'Duo Search')).toContain('duo://search?q=hello%20world')
    expect(addressToUrl('javascript:alert(1)', 'Duo Search')).toMatch(/^duo:\/\/search\?/)
  })
})
