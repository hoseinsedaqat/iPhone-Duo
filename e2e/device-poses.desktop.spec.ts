import { expect, test } from '@playwright/test'
import { devicePoseMatrix, waitForPose } from './helpers/device-poses'

test('device poses remain consistent after repeated mode, orientation and viewport changes', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/')
  const frame = page.getByTestId('device-frame')
  const partial = page.locator('.pose-button').filter({ hasText: 'Partially folded' })
  const tabletop = page.locator('.pose-button').filter({ hasText: 'Tabletop' })

  await partial.click()
  await waitForPose(frame, 'partial')
  const first = await devicePoseMatrix(frame)
  expect(Math.abs(first.m13), 'partially folded must have a visible perspective').toBeGreaterThan(.1)

  await tabletop.click()
  await waitForPose(frame, 'tabletop')
  await partial.click()
  await waitForPose(frame, 'partial')
  const second = await devicePoseMatrix(frame)
  expect(second.m13).toBeCloseTo(first.m13, 2)
  expect(second.m11).toBeCloseTo(first.m11, 2)

  await partial.click()
  await waitForPose(frame, 'partial')
  expect((await devicePoseMatrix(frame)).m13).toBeCloseTo(first.m13, 2)
  await page.getByRole('button', { name: 'Landscape', exact: true }).click()
  await waitForPose(frame, 'partial')
  expect((await devicePoseMatrix(frame)).m13).toBeCloseTo(first.m13, 2)
  await page.setViewportSize({ width: 1280, height: 720 })
  await waitForPose(frame, 'partial')
  expect((await devicePoseMatrix(frame)).m13).toBeCloseTo(first.m13, 2)
  await page.evaluate(async () => {
    for (const label of ['Open', 'Partially folded', 'Tabletop', 'Closed', 'Partially folded']) {
      const button = [...document.querySelectorAll<HTMLButtonElement>('.pose-button')].find(item => item.textContent?.trim() === label)
      if (!button) throw new Error(`Missing pose button: ${label}`)
      button.click()
      await new Promise(resolve => setTimeout(resolve, 40))
    }
  })
  await waitForPose(frame, 'partial')
  expect((await devicePoseMatrix(frame)).m13).toBeCloseTo(first.m13, 2)
  await page.reload()
  await waitForPose(frame, 'partial')
  expect((await devicePoseMatrix(frame)).m13).toBeCloseTo(first.m13, 2)

  await tabletop.click()
  await waitForPose(frame, 'tabletop')
  expect(Math.abs((await devicePoseMatrix(frame)).m23), 'tabletop must retain its own perspective').toBeGreaterThan(.1)
  await page.locator('.pose-button').filter({ hasText: 'Open', exact: true }).click()
  await waitForPose(frame, 'open')
  expect((await devicePoseMatrix(frame)).m13).toBeCloseTo(0, 3)
})
