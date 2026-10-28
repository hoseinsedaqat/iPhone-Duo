import { Suspense, lazy, useState } from 'react'
import { ArrowLeftRight, BookmarkPlus, Grid2X2, Home, MoreHorizontal, X } from 'lucide-react'
import { AppIcon } from '../components/AppIcon'
import { AppErrorBoundary } from '../components/ErrorBoundary'
import { apps } from '../apps/registry'
import { useSystemStore } from './store'
import type { AppWindow } from './types'
import { useT } from '../utils/i18n'

const SettingsApp = lazy(() => import('../apps/Settings').then(m => ({ default: m.SettingsApp })))
const SafariApp = lazy(() => import('../apps/Safari').then(m => ({ default: m.SafariApp })))
const AccountingApp = lazy(() => import('../apps/Accounting').then(m => ({ default: m.AccountingApp })))
const CalculatorApp = lazy(() => import('../apps/Calculator').then(m => ({ default: m.CalculatorApp })))
const CalendarApp = lazy(() => import('../apps/Calendar').then(m => ({ default: m.CalendarApp })))
const ClockApp = lazy(() => import('../apps/Clock').then(m => ({ default: m.ClockApp })))
const NotesApp = lazy(() => import('../apps/Notes').then(m => ({ default: m.NotesApp })))
const PhotosApp = lazy(() => import('../apps/Media').then(m => ({ default: m.PhotosApp })))
const CameraApp = lazy(() => import('../apps/Media').then(m => ({ default: m.CameraApp })))
const WeatherApp = lazy(() => import('../apps/Utilities').then(m => ({ default: m.WeatherApp })))
const FilesApp = lazy(() => import('../apps/Utilities').then(m => ({ default: m.FilesApp })))
const AppStoreApp = lazy(() => import('../apps/Utilities').then(m => ({ default: m.AppStoreApp })))
const MapsApp = lazy(() => import('../apps/Utilities').then(m => ({ default: m.MapsApp })))
const MessagesApp = lazy(() => import('../apps/Utilities').then(m => ({ default: m.MessagesApp })))
const PhoneApp = lazy(() => import('../apps/Utilities').then(m => ({ default: m.PhoneApp })))
const MusicApp = lazy(() => import('../apps/Utilities').then(m => ({ default: m.MusicApp })))
const WalletApp = lazy(() => import('../apps/Utilities').then(m => ({ default: m.WalletApp })))

export function WindowManager({ compact }: { compact: boolean }) {
  const { windows, splitRatio, setSplitRatio, swapWindows, savePair, setOverlay } = useSystemStore()
  const t = useT(); const [saved, setSaved] = useState(false)
  const split = !compact && windows.length > 1
  if (!windows[0]) return null
  return <div className={`window-manager ${split ? 'is-split' : ''}`}>
    {split && <div className="split-controls" style={{ gridTemplateColumns: `calc(${splitRatio}% - 24px) 48px minmax(0, 1fr)` }}><div className="split-control-side"><span>{t('Split View')}</span><button aria-label="Swap apps" onClick={swapWindows}><ArrowLeftRight size={15}/></button></div><span aria-hidden="true"/><div className="split-control-side split-control-end"><label><span>Resize</span><input aria-label="Resize split view" type="range" min="47" max="53" value={splitRatio} onChange={e => setSplitRatio(Number(e.target.value))}/></label><button aria-label="Save app pair" onClick={() => { savePair(); setSaved(true); window.setTimeout(() => setSaved(false), 2000) }}><BookmarkPlus size={16}/>{saved && <span>Saved</span>}</button><button aria-label="Choose another app" onClick={() => setOverlay('split-picker')}><Grid2X2 size={15}/></button></div></div>}
    {split ? <div className="split-panes" style={{ gridTemplateColumns: `calc(${splitRatio}% - 24px) 48px minmax(0, 1fr)` }}><AppWindowView key={windows[0].id} window={windows[0]} compact/><div className="split-reserved" aria-label="Reserved hinge area"><span/></div><AppWindowView key={windows[1].id} window={windows[1]} compact/></div> : <div className="single-pane"><AppWindowView window={windows[0]} compact={compact}/></div>}
  </div>
}
function AppWindowView({ window, compact }: { window: AppWindow; compact: boolean }) {
  const { closeWindow, setOverlay, goHome, setMode } = useSystemStore(); const [menu, setMenu] = useState(false); const t = useT()
  return <div className="app-window" data-app={window.app}>
    <div className="window-titlebar">
      <div className="window-title"><AppIcon id={window.app} size={17}/><span>{t(apps[window.app].name)}</span></div>
      <div className="window-actions">
        <button aria-label={`Multitasking options for ${apps[window.app].name}`} aria-expanded={menu} onClick={() => setMenu(!menu)}><MoreHorizontal size={18}/></button>
        <button aria-label={`Close ${apps[window.app].name}`} onClick={() => closeWindow(window.id)}><X size={15}/></button>
      </div>
    </div>
    <AppErrorBoundary><Suspense fallback={<div className="app-root app-loading">Opening {apps[window.app].name}…</div>}><AppRenderer window={window} compact={compact}/></Suspense></AppErrorBoundary>
    {menu && <><button className="menu-backdrop" aria-label="Close multitasking menu" onClick={() => setMenu(false)}/><div className="multitasking-menu"><button onClick={() => { if (compact) setMode('open'); setMenu(false); setOverlay('split-picker') }}><Grid2X2 size={15}/>{t('Open in Split View')}</button><button onClick={() => { setMenu(false); setOverlay('switcher') }}><MoreHorizontal size={15}/>{t('Recent Apps')}</button><button onClick={() => { setMenu(false); goHome() }}><Home size={15}/>{t('Go Home')}</button></div></>}
  </div>
}
function AppRenderer({ window, compact }: { window: AppWindow; compact: boolean }) {
  switch (window.app) {
    case 'settings': return <SettingsApp compact={compact}/>
    case 'safari': return <SafariApp windowId={window.id} compact={compact}/>
    case 'accounting': return <AccountingApp compact={compact}/>
    case 'calculator': return <CalculatorApp/>
    case 'calendar': return <CalendarApp/>
    case 'clock': return <ClockApp/>
    case 'notes': return <NotesApp compact={compact}/>
    case 'photos': return <PhotosApp/>
    case 'camera': return <CameraApp/>
    case 'weather': return <WeatherApp/>
    case 'files': return <FilesApp/>
    case 'appstore': return <AppStoreApp/>
    case 'maps': return <MapsApp/>
    case 'messages': return <MessagesApp/>
    case 'phone': return <PhoneApp/>
    case 'music': return <MusicApp/>
    case 'wallet': return <WalletApp/>
  }
}
