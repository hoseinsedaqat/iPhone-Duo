import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_APPS, type AppId, type AppWindow, type DeviceMode, type Language, type Wallpaper } from './types'

export interface Settings {
  theme: 'light' | 'dark'
  wallpaper: Wallpaper
  brightness: number
  textSize: number
  language: Language
  wifi: boolean
  network: string
  bluetooth: boolean
  cellular: boolean
  sounds: boolean
  notifications: boolean
  reduceMotion: boolean
  increaseContrast: boolean
  passcode: boolean
  alwaysOn: boolean
  searchEngine: 'Duo Search' | 'Google' | 'DuckDuckGo'
  safariSuggestions: boolean
}
export const defaultSettings: Settings = {
  theme: 'light', wallpaper: 'aurora', brightness: 100, textSize: 100, language: 'en',
  wifi: true, network: 'Duo Studio', bluetooth: true, cellular: true, sounds: false,
  notifications: true, reduceMotion: false, increaseContrast: false, passcode: false, alwaysOn: true,
  searchEngine: 'Duo Search', safariSuggestions: true,
}

interface SystemState {
  mode: DeviceMode
  orientation: 'portrait' | 'landscape'
  settings: Settings
  locked: boolean
  windows: AppWindow[]
  recent: AppId[]
  savedPairs: [AppId, AppId][]
  iconOrder: AppId[]
  widgets: { weather: boolean; calendar: boolean; photo: boolean }
  splitRatio: number
  overlay: 'none' | 'control' | 'notifications' | 'switcher' | 'split-picker' | 'widgets'
  setMode: (mode: DeviceMode) => void
  setOrientation: (orientation: 'portrait' | 'landscape') => void
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  setLocked: (locked: boolean) => void
  openApp: (app: AppId) => void
  addSplit: (app: AppId) => void
  closeWindow: (id: string) => void
  goHome: () => void
  swapWindows: () => void
  savePair: () => void
  openPair: (pair: [AppId, AppId]) => void
  reorderIcons: (from: AppId, to: AppId) => void
  toggleWidget: (widget: keyof SystemState['widgets']) => void
  setSplitRatio: (ratio: number) => void
  setOverlay: (overlay: SystemState['overlay']) => void
}
const newWindow = (app: AppId): AppWindow => ({ id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, app })
const primaryWindow = (app: AppId): AppWindow => ({ id: `primary-${app}`, app })
const recentWith = (recent: AppId[], app: AppId) => [app, ...recent.filter(item => item !== app)].slice(0, 8)

export const useSystemStore = create<SystemState>()(persist((set) => ({
  mode: 'open', orientation: 'portrait', settings: defaultSettings, locked: false, windows: [], recent: [], savedPairs: [],
  iconOrder: DEFAULT_APPS, widgets: { weather: true, calendar: true, photo: true }, splitRatio: 50, overlay: 'none',
  setMode: (mode) => set({ mode }),
  setOrientation: (orientation) => set({ orientation }),
  updateSetting: (key, value) => set(state => ({ settings: { ...state.settings, [key]: value } })),
  setLocked: (locked) => set({ locked, overlay: 'none' }),
  openApp: (app) => set(state => ({ windows: [primaryWindow(app)], recent: recentWith(state.recent, app), overlay: 'none', locked: false })),
  addSplit: (app) => set(state => ({ windows: state.windows.length ? [state.windows[0], newWindow(app)] : [newWindow(app)], recent: recentWith(state.recent, app), mode: state.mode === 'closed' ? 'open' : state.mode, overlay: 'none' })),
  closeWindow: (id) => set(state => ({ windows: state.windows.filter(window => window.id !== id), overlay: 'none' })),
  goHome: () => set({ windows: [], overlay: 'none' }),
  swapWindows: () => set(state => ({ windows: [...state.windows].reverse(), splitRatio: 100 - state.splitRatio })),
  savePair: () => set(state => {
    if (state.windows.length < 2) return state
    const pair: [AppId, AppId] = [state.windows[0].app, state.windows[1].app]
    return { savedPairs: [pair, ...state.savedPairs.filter(p => p[0] !== pair[0] || p[1] !== pair[1])].slice(0, 5) }
  }),
  openPair: (pair) => set(state => ({ windows: [primaryWindow(pair[0]), newWindow(pair[1])], mode: 'open', recent: recentWith(recentWith(state.recent, pair[0]), pair[1]), overlay: 'none' })),
  reorderIcons: (from, to) => set(state => {
    const order = [...state.iconOrder]; const start = order.indexOf(from); const end = order.indexOf(to)
    if (start < 0 || end < 0 || start === end) return state
    order.splice(start, 1); order.splice(end, 0, from); return { iconOrder: order }
  }),
  toggleWidget: (widget) => set(state => ({ widgets: { ...state.widgets, [widget]: !state.widgets[widget] } })),
  setSplitRatio: (ratio) => set({ splitRatio: Math.max(47, Math.min(53, ratio)) }),
  setOverlay: (overlay) => set({ overlay }),
}), {
  name: 'duo-simulator-settings-v1', storage: createJSONStorage(() => localStorage),
  partialize: state => ({ mode: state.mode, orientation: state.orientation, settings: state.settings, recent: state.recent, savedPairs: state.savedPairs, iconOrder: state.iconOrder, widgets: state.widgets }),
  merge: (persisted, current) => {
    const saved = (persisted ?? {}) as Partial<SystemState>
    return { ...current, ...saved, settings: { ...defaultSettings, ...saved.settings }, widgets: { ...current.widgets, ...saved.widgets }, iconOrder: Array.isArray(saved.iconOrder) ? [...saved.iconOrder.filter(id => DEFAULT_APPS.includes(id)), ...DEFAULT_APPS.filter(id => !saved.iconOrder?.includes(id))] : DEFAULT_APPS }
  },
}))

export function simulatedFeedback() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8)
  if (useSystemStore.getState().settings.sounds && typeof window !== 'undefined') {
    try {
      const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain()
      oscillator.frequency.value = 540; gain.gain.setValueAtTime(0.025, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.06)
      oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.06)
      oscillator.onended = () => { void context.close() }
    } catch { /* Audio can be unavailable in some browsers. */ }
  }
}
