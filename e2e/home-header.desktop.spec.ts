import { expect, test } from '@playwright/test'

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 900, height: 700 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 790 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
]

test('the widget ellipsis stays centred inside its round button', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    const result = await page.evaluate(() => {
      const button = document.querySelector('.widget-edit') as HTMLElement
      const icon = button.querySelector('svg') as SVGGraphicsElement
      const box = button.getBoundingClientRect()
      const iconBox = icon.getBoundingClientRect()
      const dots = [...icon.querySelectorAll('circle')].map(dot => dot.getBoundingClientRect())
      const ink = {
        left: Math.min(...dots.map(dot => dot.left)),
        right: Math.max(...dots.map(dot => dot.right)),
        top: Math.min(...dots.map(dot => dot.top)),
        bottom: Math.max(...dots.map(dot => dot.bottom)),
      }
      const margin = 0.4
      return {
        offsetX: Math.abs((ink.left + ink.right) / 2 - (box.left + box.width / 2)),
        offsetY: Math.abs((ink.top + ink.bottom) / 2 - (box.top + box.height / 2)),
        square: Math.abs(iconBox.width - iconBox.height),
        padding: getComputedStyle(button).padding,
        outside: iconBox.left < box.left + margin || iconBox.right > box.right - margin || iconBox.top < box.top + margin || iconBox.bottom > box.bottom - margin ? 1 : 0,
      }
    })
    const name = `${viewport.width}x${viewport.height}`
    expect(result.offsetX, `horizontal offset at ${name}`).toBeLessThan(1)
    expect(result.offsetY, `vertical offset at ${name}`).toBeLessThan(1)
    expect(result.square, `icon aspect at ${name}`).toBeLessThan(0.6)
    expect(result.padding, `browser default padding at ${name}`).toBe('0px')
    expect(result.outside, `icon outside the circle at ${name}`).toBe(0)
  }
})
