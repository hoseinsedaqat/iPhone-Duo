import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useSystemStore } from './store'
import { HomeScreen } from './HomeScreen'
import { LockScreen } from './LockScreen'
import { StatusBar } from './StatusBar'
import { SystemOverlays } from './Overlays'
import { WindowManager } from './WindowManager'

export function SystemScreen({ compact }: { compact: boolean }) {
  const { settings, locked, windows } = useSystemStore()
  const prefersReducedMotion = useReducedMotion()
  const reduced = settings.reduceMotion || !!prefersReducedMotion
  const view = locked ? 'lock' : windows.length ? 'apps' : 'home'
  return <div className={`device-screen theme-${settings.theme} wallpaper-${settings.wallpaper} ${settings.increaseContrast ? 'high-contrast' : ''}`} data-active-app={view === 'apps' ? windows[0]?.app : undefined} dir={settings.language === 'fa' ? 'rtl' : 'ltr'} style={{ '--text-scale': settings.textSize / 100 } as React.CSSProperties}>
    <div className="wallpaper-layer"/>
    <StatusBar compact={compact}/>
    <AnimatePresence mode="wait" initial={false}><motion.div key={view} className="screen-view" initial={reduced ? false : { opacity: 0, scale: view === 'apps' ? .96 : 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={reduced ? {} : { opacity: 0, scale: .98 }} transition={{ duration: reduced ? 0 : .2 }}>
      {view === 'lock' ? <LockScreen/> : view === 'home' ? <HomeScreen compact={compact}/> : <WindowManager compact={compact}/>}
    </motion.div></AnimatePresence>
    {!locked && <HomeIndicator hasWindows={windows.length > 0}/>}
    <SystemOverlays/>
    {settings.brightness < 100 && <div className="brightness-shade" style={{ opacity: (100 - settings.brightness) / 125 }}/>}
  </div>
}

function HomeIndicator({ hasWindows }: { hasWindows: boolean }) {
  const start = useRef<number | null>(null)
  const timer = useRef<number | null>(null)
  const ignoreClick = useRef(false)
  const clear = () => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null }
  useEffect(() => () => clear(), [])
  const activate = () => hasWindows ? useSystemStore.getState().goHome() : useSystemStore.getState().setOverlay('switcher')
  return <button className="home-indicator-button" aria-label={hasWindows ? 'Go Home' : 'Open app switcher'}
    onPointerDown={event => { start.current = event.clientY; ignoreClick.current = false; try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* synthetic pointers may not be capturable */ }; timer.current = window.setTimeout(() => { ignoreClick.current = true; useSystemStore.getState().setOverlay('switcher') }, 600) }}
    onPointerUp={event => { clear(); if (start.current !== null && start.current - event.clientY > 35) { ignoreClick.current = true; activate() }; start.current = null }}
    onPointerCancel={() => { clear(); start.current = null }}
    onClick={() => { if (ignoreClick.current) { ignoreClick.current = false; return }; activate() }}
    onContextMenu={event => { event.preventDefault(); clear(); ignoreClick.current = true; useSystemStore.getState().setOverlay('switcher') }}><span/></button>
}
