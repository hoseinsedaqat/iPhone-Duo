import { expect, test } from '@playwright/test'

test('a previously installed shell loads built-in apps and demo search offline', async ({ page, context }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.home-screen')).toBeVisible()
  await page.getByRole('button', { name: 'Open Safari' }).click()
  await page.getByLabel('Search or enter website name').fill('offline idea')
  await page.getByLabel('Search or enter website name').press('Enter')
  await expect(page.getByText('Results for “offline idea”')).toBeVisible()
  await page.getByRole('button', { name: 'Go Home' }).click()
  await page.getByRole('button', { name: 'Open Calculator' }).click()
  await expect(page.getByLabel('Calculator result')).toHaveText('0')
  expect(errors).toEqual([])
})
