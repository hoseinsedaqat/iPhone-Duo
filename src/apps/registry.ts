import type { AppId } from '../system/types'
export interface AppDefinition { id: AppId; name: string; subtitle: string; badge?: number }
export const apps: Record<AppId, AppDefinition> = {
  safari: { id: 'safari', name: 'Safari', subtitle: 'Explore the web' },
  settings: { id: 'settings', name: 'Settings', subtitle: 'Make it yours' },
  accounting: { id: 'accounting', name: 'Accounting', subtitle: 'Your money, in focus' },
  calculator: { id: 'calculator', name: 'Calculator', subtitle: 'Make it add up' },
  calendar: { id: 'calendar', name: 'Calendar', subtitle: 'Stay in the moment' },
  clock: { id: 'clock', name: 'Clock', subtitle: 'Every second counts' },
  photos: { id: 'photos', name: 'Photos', subtitle: 'Your favorite moments' },
  camera: { id: 'camera', name: 'Camera', subtitle: 'Capture the moment' },
  notes: { id: 'notes', name: 'Notes', subtitle: 'A place for your ideas' },
  files: { id: 'files', name: 'Files', subtitle: 'All in one place' },
  weather: { id: 'weather', name: 'Weather', subtitle: 'A look outside' },
  maps: { id: 'maps', name: 'Maps', subtitle: 'Find your way' },
  messages: { id: 'messages', name: 'Messages', subtitle: 'Keep in touch', badge: 2 },
  phone: { id: 'phone', name: 'Phone', subtitle: 'Stay connected' },
  music: { id: 'music', name: 'Music', subtitle: 'Sounds like you' },
  appstore: { id: 'appstore', name: 'App Store', subtitle: 'Discover something new' },
  wallet: { id: 'wallet', name: 'Wallet', subtitle: 'Everything together' },
}
