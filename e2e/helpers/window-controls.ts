import { expect, type Locator, type Page } from '@playwright/test'

/** Measure in screen layout coordinates, before the device's 3D pose is applied. */
export async function screenBox(locator: Locator) {
  return locator.evaluate(element => {
    const target = element as HTMLElement
    const screen = target.closest('.device-screen')
    let current: HTMLElement | null = target
    let x = 0
    let y = 0
    while (current && current !== screen) {
      x += current.offsetLeft
      y += current.offsetTop
      current = current.offsetParent as HTMLElement | null
    }
    if (!screen || current !== screen) throw new Error('Element is not positioned within the device screen')
    return { x, y, width: target.offsetWidth, height: target.offsetHeight }
  })
}

/** Check the controls as a pair, including the mirrored RTL layout. */
export async function expectPairedWindowControls(page: Page, appWindow: Locator) {
  const actions = appWindow.locator('.window-actions button')
  await expect(actions).toHaveCount(2)
  // Projected bounding rectangles can overlap even when the planar elements do not:
  // the status bar and buttons are at different points on the tilted display.
  const [menu, close, pane, status] = await Promise.all([
    screenBox(actions.first()),
    screenBox(actions.last()),
    screenBox(appWindow),
    screenBox(page.locator('.status-bar')),
  ])
  const rtl = await page.locator('.device-screen').getAttribute('dir') === 'rtl'
  const gap = rtl ? menu.x - (close.x + close.width) : close.x - (menu.x + menu.width)

  expect(gap, 'window actions should not overlap').toBeGreaterThanOrEqual(-1)
  expect(gap, 'menu and close should stay adjacent').toBeLessThanOrEqual(9)
  expect(Math.abs((menu.y + menu.height / 2) - (close.y + close.height / 2))).toBeLessThanOrEqual(3)
  expect(Math.min(menu.y, close.y)).toBeGreaterThanOrEqual(status.y + status.height - 3)
  for (const action of [menu, close]) {
    expect(action.x).toBeGreaterThanOrEqual(pane.x - 1)
    expect(action.x + action.width).toBeLessThanOrEqual(pane.x + pane.width + 1)
  }
  // Also check the projected positions are unobstructed and actionable.
  await actions.first().click({ trial: true })
  await actions.last().click({ trial: true })
}
