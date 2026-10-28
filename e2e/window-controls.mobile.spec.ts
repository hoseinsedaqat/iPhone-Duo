import { expect, test } from '@playwright/test'
import { expectPairedWindowControls } from './helpers/window-controls'

test('touch keeps the window actions adjacent in every device pose and direction', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const language of ['en', 'fa'] as const) {
    await page.evaluate(language => {
      localStorage.setItem('duo-simulator-settings-v1', JSON.stringify({ state: { settings: { language } }, version: 0 }))
    }, language)
    await page.reload()
    await page.getByRole('button', { name: 'Open Settings', exact: true }).tap()
    const pane = page.locator('.single-pane .app-window')
    for (const position of ['Open', 'Closed', 'Partially folded', 'Tabletop']) {
      for (const orientation of ['Portrait', 'Landscape']) {
        await page.locator('.pose-button').filter({ hasText: position }).tap()
        await page.getByRole('button', { name: orientation, exact: true }).tap()
        await expectPairedWindowControls(page, pane)
      }
    }
    await pane.getByRole('button', { name: 'Close Settings', exact: true }).tap()
    await expect(page.locator('.home-screen')).toBeVisible()
  }
})

test('the paired Split View menus and their actions work by touch on a short screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const language of ['en', 'fa'] as const) {
    await page.evaluate(language => {
      localStorage.setItem('duo-simulator-settings-v1', JSON.stringify({ state: { settings: { language } }, version: 0 }))
    }, language)
    await page.reload()
    await page.getByRole('button', { name: 'Open Safari', exact: true }).tap()
    await page.getByRole('button', { name: 'Multitasking options for Safari' }).tap()
    await page.locator('.multitasking-menu button').first().tap()
    await page.locator('.split-app-grid button').filter({ hasText: language === 'fa' ? 'ماشین حساب' : 'Calculator' }).tap()
    await page.getByRole('button', { name: 'Landscape', exact: true }).tap()
    const panes = page.locator('.split-panes .app-window')
    await expect(panes).toHaveCount(2)
    for (const pane of await panes.all()) await expectPairedWindowControls(page, pane)
    await page.getByRole('button', { name: 'Multitasking options for Safari' }).tap()
    await page.locator('.app-window[data-app="safari"] .multitasking-menu button').nth(1).tap()
    await expect(page.getByRole('button', { name: 'Close app switcher' })).toBeVisible()
    await page.getByRole('button', { name: 'Close app switcher' }).tap()
    await page.getByRole('button', { name: 'Multitasking options for Calculator' }).tap()
    await page.locator('.app-window[data-app="calculator"] .multitasking-menu button').nth(2).tap()
    await expect(page.locator('.home-screen')).toBeVisible()
  }
})
