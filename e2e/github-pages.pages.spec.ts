import { expect, test } from '@playwright/test'

const basePath = '/iPhone-Duo/'

test('project Pages loads assets, manifest, and never-opened apps offline', async ({ page, context }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

  await page.goto('./')
  await expect(page).toHaveTitle(/iPhone Duo Simulator.*Unofficial/)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /unofficial iPhone Duo web simulator.*Split View/i)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /iPhone Duo Simulator.*Unofficial/)
  await expect(page.locator('.home-screen')).toBeVisible()
  await expect(page.locator('.wallpaper-layer')).toHaveCSS('background-image', /\/iPhone-Duo\/wallpapers\/aurora\.png/)
  await expect(page.locator('.site-shell')).toHaveCSS('background-image', /\/iPhone-Duo\/images\/glass-atmosphere\.jpg/)

  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!
    const response = await fetch(link.href)
    const data = await response.json() as { start_url: string; scope: string; icons: { src: string }[] }
    return {
      status: response.status,
      url: new URL(link.href).pathname,
      startUrl: new URL(data.start_url, link.href).pathname,
      scope: new URL(data.scope, link.href).pathname,
      icons: data.icons.map(icon => new URL(icon.src, link.href).pathname),
    }
  })
  expect(manifest).toEqual({
    status: 200,
    url: `${basePath}manifest.webmanifest`,
    startUrl: basePath,
    scope: basePath,
    icons: [`${basePath}icons/icon-192.png`, `${basePath}icons/icon-512.png`, `${basePath}icons/icon.svg`],
  })

  await page.getByRole('button', { name: 'Open Photos', exact: true }).click()
  const sample = page.getByAltText('The coast · Sample photo')
  await expect(sample).toHaveAttribute('src', `${basePath}images/coast.png`)
  await expect.poll(() => sample.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)

  const registration = await page.evaluate(async () => {
    const worker = await navigator.serviceWorker.ready
    return { scope: new URL(worker.scope).pathname, script: new URL(worker.active!.scriptURL).pathname }
  })
  expect(registration).toEqual({ scope: basePath, script: `${basePath}sw.js` })
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)

  await context.setOffline(true)
  await page.reload()
  await expect(page).toHaveTitle(/iPhone Duo Simulator.*Unofficial/)
  await expect(page.locator('.home-screen')).toBeVisible()
  const offlineBackgroundWidth = await page.evaluate(async () => {
    const image = new Image()
    image.src = new URL('images/glass-atmosphere.jpg', location.href).href
    await image.decode()
    return image.naturalWidth
  })
  expect(offlineBackgroundWidth).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Open Safari' }).click()
  await page.getByLabel('Search or enter website name').fill('offline Pages search')
  await page.getByLabel('Search or enter website name').press('Enter')
  await expect(page.getByText('Results for “offline Pages search”')).toBeVisible()
  await page.getByRole('button', { name: 'Go Home' }).click()
  await page.getByRole('button', { name: 'Open Calculator' }).click()
  await expect(page.getByLabel('Calculator result')).toHaveText('0')
  expect(errors).toEqual([])
})
