import { expect, test, type Locator } from '@playwright/test'

async function box(locator: Locator) {
  const result = await locator.boundingBox()
  expect(result).not.toBeNull()
  return result!
}

test('Guide opens next to its button on narrow, regular, and ultra-wide screens', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const viewport of [
    { width: 3440, height: 1440 }, { width: 2560, height: 1440 }, { width: 1920, height: 1080 },
    { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 },
    { width: 844, height: 390 }, { width: 640, height: 320 }, { width: 390, height: 844 },
    { width: 320, height: 568 }, { width: 280, height: 640 },
  ]) {
    await page.setViewportSize(viewport)
    const trigger = page.getByRole('button', { name: 'Guide', exact: true })
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const guide = page.getByRole('dialog', { name: 'Simulator guide' })
    await expect(guide).toBeVisible()
    const buttonBounds = await box(trigger)
    const guideBounds = await box(guide)
    expect(Math.abs(guideBounds.x + guideBounds.width - (buttonBounds.x + buttonBounds.width)), `guide horizontal alignment at ${viewport.width}`).toBeLessThanOrEqual(2)
    expect(guideBounds.y - (buttonBounds.y + buttonBounds.height)).toBeGreaterThanOrEqual(6)
    expect(guideBounds.y - (buttonBounds.y + buttonBounds.height)).toBeLessThanOrEqual(14)
    expect(guideBounds.x).toBeGreaterThanOrEqual(0)
    expect(guideBounds.x + guideBounds.width).toBeLessThanOrEqual(viewport.width)
    expect(guideBounds.y + guideBounds.height).toBeLessThanOrEqual(viewport.height)
    await page.keyboard.press('Escape')
    await expect(guide).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  }
})

test('Home explains its purpose and does not discard a locked app', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const home = page.getByRole('button', { name: 'Home', exact: true })
  const feedback = page.locator('.home-feedback')
  await home.click()
  await expect(feedback).toHaveText('You are already on the Home Screen.')
  await expect(home).toHaveAttribute('title', 'You are already on the Home Screen.')

  await page.getByRole('button', { name: 'Open Control Center' }).click()
  await home.click()
  await expect(page.getByRole('button', { name: 'Close Control Center' })).toHaveCount(0)
  await expect(page.locator('.home-screen')).toBeVisible()

  await page.getByRole('button', { name: 'Open Settings', exact: true }).click()
  await page.getByText('Face ID & Passcode', { exact: true }).click()
  await page.getByRole('switch', { name: 'Simulated Passcode' }).click()
  await home.click()
  await expect(page.locator('.home-screen')).toBeVisible()
  await page.getByRole('button', { name: 'Open Calculator', exact: true }).click()
  await page.getByRole('button', { name: 'Lock screen', exact: true }).click()
  await home.click()
  await expect(feedback).toHaveText('Unlock the screen to return Home.')
  await expect(page.locator('.lock-screen')).toBeVisible()
  await page.getByRole('button', { name: 'Swipe up or click to unlock' }).click()
  await expect(page.getByText('This is not device security.')).toBeVisible()
  for (const digit of ['1', '2', '3', '4']) await page.locator('.passcode-grid').getByRole('button', { name: digit, exact: true }).click()
  await expect(page.locator('.calculator-app')).toBeVisible()
  await home.click()
  await expect(page.locator('.home-screen')).toBeVisible()
})

test('responsive pose and orientation controls do not overflow or collide', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const viewport of [
    { width: 280, height: 640 }, { width: 300, height: 640 }, { width: 320, height: 568 },
    { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 620, height: 800 },
    { width: 640, height: 320 }, { width: 768, height: 1024 }, { width: 844, height: 390 },
    { width: 900, height: 700 }, { width: 960, height: 800 }, { width: 961, height: 800 }, { width: 1024, height: 768 },
    { width: 1100, height: 800 }, { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport)
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(horizontalOverflow, `horizontal scrolling at ${viewport.width}`).toBeLessThanOrEqual(0)
    for (const control of await page.locator('.pose-button, .orientation-control button').all()) {
      const result = await control.evaluate(element => {
        const b = element.getBoundingClientRect()
        return { left: b.left, right: b.right, overflow: element.scrollWidth - element.clientWidth }
      })
      expect(result.left, `left bound at ${viewport.width}`).toBeGreaterThanOrEqual(0)
      expect(result.right, `right bound at ${viewport.width}`).toBeLessThanOrEqual(viewport.width)
      expect(result.overflow, `control text overflow at ${viewport.width}`).toBeLessThanOrEqual(1)
    }
  }
})
