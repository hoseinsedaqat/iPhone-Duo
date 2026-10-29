import { expect, test } from '@playwright/test'

const viewports = [
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 730 },
  { width: 1536, height: 790 },
  { width: 1536, height: 800 },
  { width: 1536, height: 820 },
  { width: 1536, height: 840 },
  { width: 1536, height: 864 },
  { width: 1536, height: 960 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
]

test('every launcher row stays above the dock from tablet to ultra-wide widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    const result = await page.evaluate(() => {
      const dock = document.querySelector('.dock')!.getBoundingClientRect()
      const vertical = dock.height > dock.width
      const icons = [...document.querySelectorAll('.home-page .app-icon-holder')].map(element => element.getBoundingClientRect())
      const labels = [...document.querySelectorAll('.home-page .app-label')].map(element => element.getBoundingClientRect())
      const screen = document.querySelector('.device-screen')!.getBoundingClientRect()
      return {
        clearance: vertical
          ? Math.round(dock.left - Math.max(...icons.map(box => box.right)))
          : Math.round(dock.top - Math.max(...labels.map(box => box.bottom))),
        outside: icons.filter(box => box.right > screen.right + 1 || box.bottom > screen.bottom + 1).length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        icon: Math.round(icons[0].width),
      }
    })
    expect(result.clearance, `dock clearance at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(4)
    expect(result.outside, `icons outside the display at ${viewport.width}x${viewport.height}`).toBe(0)
    expect(result.overflow, `horizontal overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(0)
    expect(result.icon, `icon size at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(20)
  }
})

test('the device keeps one size per window height instead of jumping between widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const height of [768, 864, 900]) {
    const widths: number[] = []
    for (const width of [1366, 1440, 1536, 1680, 1920]) {
      await page.setViewportSize({ width, height })
      widths.push(await page.locator('.device-frame').evaluate(element => Math.round(element.getBoundingClientRect().width)))
    }
    expect(new Set(widths).size, `device width at ${height}px height: ${widths.join(', ')}`).toBe(1)
  }
})

test('the control deck stays attached to the device on very wide screens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const width of [1366, 1536, 1920, 2560, 3440]) {
    await page.setViewportSize({ width, height: 1440 })
    const gap = await page.evaluate(() => {
      const frame = document.querySelector('.device-frame')!.getBoundingClientRect()
      const deck = document.querySelector('.controls-column')!.getBoundingClientRect()
      return Math.round(deck.top - frame.bottom)
    })
    expect(gap, `deck distance from the device at ${width}px`).toBeLessThanOrEqual(40)
    expect(gap).toBeGreaterThanOrEqual(0)
  }
})
