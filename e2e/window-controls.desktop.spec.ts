import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectPairedWindowControls, screenBox } from './helpers/window-controls'

async function assertMenuInPane(page: Page, pane: Locator) {
  const trigger = pane.locator('.window-actions button').first()
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const menu = pane.locator('.multitasking-menu')
  await expect(menu).toBeVisible()
  const [triggerBox, menuBox, paneBox] = await Promise.all([screenBox(trigger), screenBox(menu), screenBox(pane)])
  expect(menuBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height - 3)
  expect(menuBox.x).toBeGreaterThanOrEqual(paneBox.x - 1)
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(paneBox.x + paneBox.width + 1)
  expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(paneBox.y + paneBox.height + 1)
  expect(menuBox.x).toBeLessThanOrEqual(triggerBox.x + triggerBox.width / 2)
  expect(menuBox.x + menuBox.width).toBeGreaterThanOrEqual(triggerBox.x + triggerBox.width / 2)
  await menu.getByRole('button').first().click({ trial: true })
  // Find a genuinely visible backdrop point: a tilted pane's bounding-box
  // corners can lie outside its projected shape.
  const point = await pane.getByRole('button', { name: 'Close multitasking menu' }).evaluate(backdrop => {
    const rect = backdrop.getBoundingClientRect()
    for (const y of [.5, .35, .65, .2, .8]) for (const x of [.2, .8, .35, .65, .5]) {
      const point = { x: rect.left + rect.width * x, y: rect.top + rect.height * y }
      if (document.elementFromPoint(point.x, point.y) === backdrop) return point
    }
    return null
  })
  expect(point, 'menu backdrop should be reachable').not.toBeNull()
  await page.mouse.click(point!.x, point!.y)
  await expect(menu).toHaveCount(0)
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
}

async function setAppearance(page: Page, language: 'en' | 'fa', theme: 'light' | 'dark') {
  await page.evaluate(({ language, theme }) => {
    localStorage.setItem('duo-simulator-settings-v1', JSON.stringify({ state: { settings: { language, theme } }, version: 0 }))
  }, { language, theme })
  await page.reload()
  await expect(page.locator('.device-screen')).toHaveAttribute('dir', language === 'fa' ? 'rtl' : 'ltr')
}

test('window controls stay together in all poses and orientations at different viewport sizes', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const sizes = [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 }]
  for (const viewport of sizes) for (const language of ['en', 'fa'] as const) {
    await page.setViewportSize(viewport)
    await setAppearance(page, language, language === 'fa' ? 'dark' : 'light')
    await page.getByRole('button', { name: 'Open Safari', exact: true }).click()
    const pane = page.locator('.single-pane .app-window')
    for (const position of ['Open', 'Closed', 'Partially folded', 'Tabletop']) {
      for (const orientation of ['Portrait', 'Landscape']) {
        await page.locator('.pose-button').filter({ hasText: position }).click()
        await page.getByRole('button', { name: orientation, exact: true }).click()
        await expectPairedWindowControls(page, pane)
      }
    }
    await assertMenuInPane(page, pane)
    await pane.getByRole('button', { name: 'Close Safari', exact: true }).click()
    await expect(page.locator('.home-screen')).toBeVisible()
  }
})

test('both Split View panes retain adjacent, usable controls in LTR and RTL', async ({ page }) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const viewport of [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    for (const language of ['en', 'fa'] as const) {
      await page.setViewportSize(viewport)
      await setAppearance(page, language, language === 'fa' ? 'dark' : 'light')
      await page.getByRole('button', { name: 'Open Safari', exact: true }).click()
      await page.getByRole('button', { name: 'Multitasking options for Safari' }).click()
      await page.locator('.multitasking-menu button').first().click()
      await page.locator('.split-app-grid button').filter({ hasText: language === 'fa' ? 'ماشین حساب' : 'Calculator' }).click()
      const panes = page.locator('.split-panes .app-window')
      await expect(panes).toHaveCount(2)
      for (const orientation of ['Portrait', 'Landscape']) {
        await page.getByRole('button', { name: orientation, exact: true }).click()
        for (const pane of await panes.all()) await expectPairedWindowControls(page, pane)
      }
      for (const pane of await panes.all()) await assertMenuInPane(page, pane)
      await page.getByRole('button', { name: 'Close Calculator', exact: true }).click()
      await expect(page.locator('.single-pane .app-window')).toHaveCount(1)
      await expectPairedWindowControls(page, page.locator('.single-pane .app-window'))
      await page.getByRole('button', { name: 'Close Safari', exact: true }).click()
      await expect(page.locator('.home-screen')).toBeVisible()
    }
  }
})
