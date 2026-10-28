import { expect, type Locator } from '@playwright/test'

export async function waitForPose(frame: Locator, mode: string) {
  await expect(frame).toHaveAttribute('data-mode', mode)
  // Let CSS transitions and any browser layout animations complete.
  await frame.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  await expect.poll(() => frame.evaluate(element => {
    void getComputedStyle(element).transform
    return element.getAnimations().filter(animation => animation.playState === 'running').length
  }), { timeout: 8_000 }).toBe(0)
}

export async function devicePoseMatrix(frame: Locator) {
  return frame.evaluate(element => {
    const transform = getComputedStyle(element).transform
    const value = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform)
    return { m11: value.m11, m13: value.m13, m23: value.m23, m33: value.m33 }
  })
}
