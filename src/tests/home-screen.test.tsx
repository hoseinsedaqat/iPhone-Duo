import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { apps } from '../apps/registry'
import { HomeScreen } from '../system/HomeScreen'
import { useSystemStore } from '../system/store'
import { DEFAULT_APPS, DOCK_APPS } from '../system/types'

vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => [] }))

afterEach(() => {
  cleanup()
  useSystemStore.getState().goHome()
})

describe('home screen', () => {
  it.each([false, true])('renders every app without decorative page dots (compact: %s)', compact => {
    const { container } = render(<HomeScreen compact={compact}/>)
    expect(container.querySelector('.home-page-dots')).not.toBeInTheDocument()
    const launcher = within(screen.getByRole('region', { name: 'Home Screen apps' }))
    const dock = within(screen.getByLabelText('Dock'))
    for (const id of DEFAULT_APPS) {
      const group = DOCK_APPS.includes(id) ? dock : launcher
      expect(group.getByRole('button', { name: `Open ${apps[id].name}` })).toBeVisible()
    }
    fireEvent.click(launcher.getByRole('button', { name: 'Open Calculator' }))
    expect(useSystemStore.getState().windows[0]?.app).toBe('calculator')
  })
})
