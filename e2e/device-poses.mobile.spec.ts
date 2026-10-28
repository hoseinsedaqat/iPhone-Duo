import { expect, test } from '@playwright/test'
import { devicePoseMatrix, waitForPose } from './helpers/device-poses'

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`touch stays usable while device poses change (${reducedMotion})`, async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion })
    await page.goto('/')
    const frame = page.getByTestId('device-frame')
    const partial = page.locator('.pose-button').filter({ hasText: 'Partially folded' })
    const tabletop = page.locator('.pose-button').filter({ hasText: 'Tabletop' })
    const key = (name: string) => page.locator('.calculator-app').getByRole('button', { name, exact: true })

    await partial.tap()
    await waitForPose(frame, 'partial')
    const first = await devicePoseMatrix(frame)
    expect(Math.abs(first.m13)).toBeGreaterThan(.1)
    await page.getByRole('button', { name: 'Open Calculator', exact: true }).tap()
    await key('7').tap()

    await tabletop.tap()
    await waitForPose(frame, 'tabletop')
    expect(Math.abs((await devicePoseMatrix(frame)).m23)).toBeGreaterThan(.1)
    await key('+').tap()
    await partial.tap()
    await waitForPose(frame, 'partial')
    expect((await devicePoseMatrix(frame)).m13).toBeCloseTo(first.m13, 2)
    await key('8').tap()
    await key('Equals').tap()
    await expect(page.getByLabel('Calculator result')).toHaveText('15')

    await page.locator('.pose-button').filter({ hasText: 'Closed' }).tap()
    await waitForPose(frame, 'closed')
    await expect(page.getByLabel('Calculator result')).toHaveText('15')
    await partial.tap()
    await waitForPose(frame, 'partial')
    expect((await devicePoseMatrix(frame)).m13).toBeCloseTo(first.m13, 2)
    await expect(page.getByLabel('Calculator result')).toHaveText('15')
    await page.getByRole('button', { name: 'Close Calculator', exact: true }).tap()
    await expect(page.locator('.home-screen')).toBeVisible()
  })
}
