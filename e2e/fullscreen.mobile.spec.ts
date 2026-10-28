import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectPairedWindowControls } from './helpers/window-controls'

async function box(locator: Locator) {
  const result = await locator.boundingBox()
  expect(result).not.toBeNull()
  return result!
}

async function expectHomeClear(page: Page, position: string, orientation: string) {
  await expect(page.locator('.home-page-dots')).toHaveCount(0)
  const obstacles = [await box(page.locator('.dock')), await box(page.locator('.home-indicator-button'))]
  for (const icon of await page.locator('.home-page .app-button').all()) {
    const iconBox = await box(icon)
    for (const obstacle of obstacles) {
      const separated = iconBox.x + iconBox.width <= obstacle.x + 1 || iconBox.x >= obstacle.x + obstacle.width - 1 || iconBox.y + iconBox.height <= obstacle.y + 1 || iconBox.y >= obstacle.y + obstacle.height - 1
      expect(separated, `${position} ${orientation} icons must clear the dock and home gesture`).toBe(true)
    }
  }
}

async function checkAppBounds(page: Page, name: string) {
  const screen = await box(page.locator('.device-screen'))
  const window = await box(page.locator('.single-pane .app-window'))
  const status = await box(page.locator('.status-bar'))
  const menu = await box(page.getByRole('button', { name: `Multitasking options for ${name}` }))
  const close = await box(page.getByRole('button', { name: `Close ${name}`, exact: true }))
  for (const difference of [window.x - screen.x, window.y - screen.y, window.width - screen.width, window.height - screen.height]) expect(Math.abs(difference)).toBeLessThanOrEqual(1)
  expect(menu.y).toBeGreaterThanOrEqual(status.y + status.height - 1)
  expect(close.y).toBeGreaterThanOrEqual(status.y + status.height - 1)
  await expectPairedWindowControls(page, page.locator('.single-pane .app-window'))
}

test('full-screen apps, safe controls and home layout work by touch in every display orientation', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const { position, orientation } of [
    { position: 'Open', orientation: 'Portrait' },
    { position: 'Closed', orientation: 'Portrait' },
    { position: 'Closed', orientation: 'Landscape' },
    { position: 'Open', orientation: 'Landscape' },
  ]) {
    await page.locator('.pose-button').filter({ hasText: position }).tap()
    await page.getByRole('button', { name: orientation, exact: true }).tap()
    await expectHomeClear(page, position, orientation)
    await page.getByRole('button', { name: 'Open Calculator', exact: true }).tap()
    await expect(page.getByLabel('Calculator result')).toHaveText('0')
    await checkAppBounds(page, 'Calculator')
    for (const key of ['7', '+', '8', 'Equals']) await page.locator('.calculator-app').getByRole('button', { name: key, exact: true }).tap()
    await expect(page.getByLabel('Calculator result')).toHaveText('15')
    await page.getByRole('button', { name: 'Multitasking options for Calculator' }).tap()
    await page.locator('.multitasking-menu').getByRole('button', { name: 'Go Home', exact: true }).tap()
    await expect(page.locator('.home-screen')).toBeVisible()
    await page.getByRole('button', { name: 'Open Safari', exact: true }).tap()
    await checkAppBounds(page, 'Safari')
    await page.getByRole('button', { name: 'Close Safari', exact: true }).tap()
    await expect(page.locator('.home-screen')).toBeVisible()
  }
})

test('outer-screen editing remains usable and an open note survives unfolding', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('.pose-button').filter({ hasText: 'Closed' }).tap()
  await page.getByRole('button', { name: 'Open Accounting', exact: true }).tap()
  await page.getByRole('button', { name: 'Add transaction' }).tap()
  const sheet = await box(page.locator('.transaction-form'))
  const gesture = await box(page.locator('.home-indicator-button'))
  expect(sheet.y + sheet.height).toBeLessThanOrEqual(gesture.y + 1)
  await page.getByLabel('Amount').fill('12.30')
  await page.getByLabel('Description').fill('Mobile expense')
  await page.getByRole('button', { name: 'Save', exact: true }).tap()
  await expect(page.locator('.balance-card strong')).toHaveText('$4,063.20')
  await page.getByRole('button', { name: 'Go Home', exact: true }).tap()
  await page.getByRole('button', { name: 'Open Notes', exact: true }).tap()
  await page.getByRole('button', { name: 'New note' }).first().tap()
  await page.getByLabel('Note title').fill('Duo note')
  await page.getByLabel('Note text').fill('Saved on the outer display.')
  await page.locator('.pose-button').filter({ hasText: 'Open' }).tap()
  await expect(page.getByLabel('Note text')).toHaveValue('Saved on the outer display.')
  await checkAppBounds(page, 'Notes')
})

test('the smallest supported viewport keeps the launcher and system gestures separate', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const position of ['Open', 'Closed']) for (const orientation of ['Portrait', 'Landscape']) {
    await page.locator('.pose-button').filter({ hasText: position }).tap()
    await page.getByRole('button', { name: orientation, exact: true }).tap()
    await expectHomeClear(page, position, orientation)
    await page.getByRole('button', { name: 'Open Wallet', exact: true }).tap()
    await checkAppBounds(page, 'Wallet')
    await page.getByRole('button', { name: 'Close Wallet', exact: true }).tap()
    if (orientation === 'Landscape') {
      await page.getByRole('button', { name: 'Open Calculator', exact: true }).tap()
      await expect(page.getByLabel('Calculator result')).toHaveText('0')
      expect((await box(page.locator('.calculator-keys button').first())).height).toBeGreaterThanOrEqual(20)
      for (const key of ['7', '+', '8', 'Equals']) await page.locator('.calculator-app').getByRole('button', { name: key, exact: true }).tap()
      await expect(page.getByLabel('Calculator result')).toHaveText('15')
      await page.getByRole('button', { name: 'Close Calculator', exact: true }).tap()
    }
  }
})

test('camera permission is explicit and remains reachable in short landscape displays', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { cameraRequests: number }
    state.cameraRequests = 0
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: () => {
      state.cameraRequests += 1
      return Promise.reject(new DOMException('Denied by test', 'NotAllowedError'))
    } } })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.locator('.pose-button').filter({ hasText: 'Closed' }).tap()
    await page.getByRole('button', { name: 'Landscape', exact: true }).tap()
    await page.getByRole('button', { name: 'Open Camera', exact: true }).tap()
    const permission = page.getByRole('button', { name: 'Enable Camera' })
    await expect(permission).toBeVisible()
    expect(await page.evaluate(() => (window as Window & { cameraRequests: number }).cameraRequests)).toBe(0)
    const permissionBox = await box(permission)
    const gesture = await box(page.locator('.home-indicator-button'))
    expect(permissionBox.y + permissionBox.height).toBeLessThanOrEqual(gesture.y + 1)
    await permission.tap()
    expect(await page.evaluate(() => (window as Window & { cameraRequests: number }).cameraRequests)).toBe(1)
    await expect(page.getByRole('alert')).toContainText('Camera access was denied')
    await expect(page.getByRole('button', { name: 'Take photo' })).toBeDisabled()
  }
})

test('local messages remain readable after sending on a short display', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('.pose-button').filter({ hasText: 'Closed' }).tap()
  await page.getByRole('button', { name: 'Landscape', exact: true }).tap()
  await page.getByRole('button', { name: 'Open Messages', exact: true }).tap()
  await page.getByLabel('Message', { exact: true }).fill('A local test message')
  await page.getByRole('button', { name: 'Add local message' }).tap()
  const message = await box(page.getByText('A local test message'))
  const conversation = await box(page.locator('.message-conversation'))
  const input = await box(page.getByLabel('Message', { exact: true }))
  const gesture = await box(page.locator('.home-indicator-button'))
  expect(message.y).toBeGreaterThanOrEqual(conversation.y - 1)
  expect(message.y + message.height).toBeLessThanOrEqual(conversation.y + conversation.height + 1)
  expect(input.y + input.height).toBeLessThanOrEqual(gesture.y + 1)
})
