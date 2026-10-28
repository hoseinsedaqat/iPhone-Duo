import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectPairedWindowControls } from './helpers/window-controls'

const appNames = ['Calendar', 'Photos', 'Camera', 'Clock', 'App Store', 'Notes', 'Files', 'Weather', 'Accounting', 'Maps', 'Calculator', 'Settings', 'Wallet', 'Phone', 'Safari', 'Messages', 'Music']
const pose = (page: Page, label: string) => page.locator('.pose-button').filter({ hasText: label })

async function box(locator: Locator) {
  const result = await locator.boundingBox()
  expect(result).not.toBeNull()
  return result!
}

async function expectFullScreenWithSafeControls(page: Page, name: string) {
  await expect(page.locator('.single-pane .app-root:not(.app-loading)')).toBeVisible()
  const screen = await box(page.locator('.device-screen'))
  const window = await box(page.locator('.single-pane .app-window'))
  const content = await box(page.locator('.single-pane .app-root'))
  for (const difference of [window.x - screen.x, window.y - screen.y, window.width - screen.width, window.height - screen.height, content.x - screen.x, content.width - screen.width, content.y + content.height - screen.y - screen.height]) {
    expect(Math.abs(difference), `${name} should reach the display edges`).toBeLessThanOrEqual(1)
  }
  const status = await box(page.locator('.status-bar'))
  const menu = await box(page.getByRole('button', { name: `Multitasking options for ${name}` }))
  const close = await box(page.getByRole('button', { name: `Close ${name}`, exact: true }))
  expect(menu.y, `${name} menu must clear the status bar`).toBeGreaterThanOrEqual(status.y + status.height - 1)
  expect(close.y, `${name} close button must clear the status bar`).toBeGreaterThanOrEqual(status.y + status.height - 1)
  expect(menu.x + menu.width).toBeLessThanOrEqual(close.x)
  expect(close.x + close.width).toBeLessThanOrEqual(screen.x + screen.width)
  await expectPairedWindowControls(page, page.locator('.single-pane .app-window'))
}

test('every app fills both displays and leaves status and window controls separate', async ({ page }) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  for (const position of ['Open', 'Closed']) {
    await pose(page, position).click()
    for (const name of appNames) {
      await page.getByRole('button', { name: `Open ${name}`, exact: true }).click()
      await expectFullScreenWithSafeControls(page, name)
      await page.getByRole('button', { name: `Close ${name}`, exact: true }).click()
      await expect(page.locator('.home-screen')).toBeVisible()
    }
  }
  expect(errors).toEqual([])
})

test('compact landscape keeps controls clickable, the app full-size, and split view usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await pose(page, 'Closed').click()
  await page.getByRole('button', { name: 'Landscape', exact: true }).click()
  await page.getByRole('button', { name: 'Open Safari', exact: true }).click()
  await expectFullScreenWithSafeControls(page, 'Safari')
  await page.getByRole('button', { name: 'Multitasking options for Safari' }).click()
  await page.getByRole('button', { name: 'Open in Split View' }).click()
  await expect(page.locator('.device-frame')).toHaveAttribute('data-mode', 'open')
  await page.getByRole('button', { name: 'Calculator', exact: true }).click()
  await expect(page.locator('.app-window')).toHaveCount(2)
  await page.locator('.calculator-app').getByRole('button', { name: '8', exact: true }).click()
  await expect(page.getByLabel('Calculator result')).toHaveText('8')
})

test('short desktop landscape keeps the launcher clear of the dock and home gesture', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Landscape', exact: true }).click()
  const obstacles = [await box(page.locator('.dock')), await box(page.locator('.home-indicator-button'))]
  for (const icon of await page.locator('.home-page .app-button').all()) {
    const iconBox = await box(icon)
    for (const obstacle of obstacles) {
      const separated = iconBox.x + iconBox.width <= obstacle.x + 1 || iconBox.x >= obstacle.x + obstacle.width - 1 || iconBox.y + iconBox.height <= obstacle.y + 1 || iconBox.y >= obstacle.y + obstacle.height - 1
      expect(separated).toBe(true)
    }
  }
})

test('Split View keeps its home gesture clear of the hinge in both themes and directions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const language of ['en', 'fa']) for (const theme of ['light', 'dark']) {
    await page.evaluate(({ language, theme }) => {
      localStorage.setItem('duo-simulator-settings-v1', JSON.stringify({ state: { settings: { language, theme } }, version: 0 }))
    }, { language, theme })
    await page.reload()
    await expect(page.locator('.device-screen')).toHaveAttribute('dir', language === 'fa' ? 'rtl' : 'ltr')
    await page.getByRole('button', { name: 'Open Safari', exact: true }).click()
    await page.getByRole('button', { name: 'Multitasking options for Safari' }).click()
    await page.locator('.multitasking-menu button').first().click()
    await page.locator('.split-app-grid button').filter({ hasText: language === 'fa' ? 'ماشین حساب' : 'Calculator' }).click()
    await expect(page.locator('.app-window')).toHaveCount(2)
    const gesture = await box(page.locator('.home-indicator-button'))
    const hinge = await box(page.locator('.split-reserved'))
    expect(gesture.x + gesture.width <= hinge.x || gesture.x >= hinge.x + hinge.width).toBe(true)
    await expect(page.locator('.home-indicator-button span')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(page.locator('.home-indicator-button span')).toHaveCSS('mix-blend-mode', 'difference')
    const status = await box(page.locator('.status-bar'))
    for (const action of await page.locator('.window-actions button').all()) expect((await box(action)).y).toBeGreaterThanOrEqual(status.y + status.height - 1)
    await page.locator('.calculator-app').getByRole('button', { name: '8', exact: true }).click()
    await expect(page.getByLabel('Calculator result')).toHaveText('8')
    await page.getByRole('button', { name: 'Go Home', exact: true }).click()
    await expect(page.locator('.home-screen')).toBeVisible()
  }
})
