export type AppId = 'safari' | 'settings' | 'accounting' | 'calculator' | 'calendar' | 'clock' | 'photos' | 'camera' | 'notes' | 'files' | 'weather' | 'maps' | 'messages' | 'phone' | 'music' | 'appstore' | 'wallet'
export type DeviceMode = 'open' | 'closed' | 'partial' | 'tabletop'
export type Wallpaper = 'aurora' | 'dusk' | 'ocean'
export type Language = 'en' | 'fa'
export interface AppWindow { id: string; app: AppId }
export const DEFAULT_APPS: AppId[] = ['calendar', 'photos', 'camera', 'clock', 'appstore', 'notes', 'files', 'weather', 'accounting', 'maps', 'calculator', 'settings', 'wallet', 'phone', 'safari', 'messages', 'music']
export const DOCK_APPS: AppId[] = ['phone', 'safari', 'messages', 'music']
