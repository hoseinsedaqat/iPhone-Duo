import { describe, expect, it } from 'vitest'
import { useSystemStore } from '../system/store'

describe('device and window continuity', () => {
  it('keeps two windows while switching displays and can swap them', () => {
    const store = useSystemStore.getState()
    store.goHome(); store.openApp('safari'); useSystemStore.getState().addSplit('calculator')
    const before = useSystemStore.getState().windows
    useSystemStore.getState().setMode('closed')
    expect(useSystemStore.getState().windows).toEqual(before)
    useSystemStore.getState().setMode('open'); useSystemStore.getState().swapWindows()
    expect(useSystemStore.getState().windows.map(item => item.app)).toEqual(['calculator', 'safari'])
    useSystemStore.getState().setSplitRatio(90)
    expect(useSystemStore.getState().splitRatio).toBe(53)
  })
})
