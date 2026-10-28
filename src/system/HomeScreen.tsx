import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../persistence/database'
import { dateKey } from '../utils/calendar'
import { CalendarDays, CloudSun, Grip, MoreHorizontal, Search, Sun } from 'lucide-react'
import { AppIcon } from '../components/AppIcon'
import { apps } from '../apps/registry'
import { DOCK_APPS, type AppId } from './types'
import { simulatedFeedback, useSystemStore } from './store'
import { useNow } from '../utils/time'
import { useT } from '../utils/i18n'

function AppButton({ id, dock = false }: { id: AppId; dock?: boolean }) {
  const { openApp, addSplit, reorderIcons, iconOrder, mode, windows, settings } = useSystemStore()
  const t = useT()
  const [menu, setMenu] = useState(false)
  const timer = useRef<number | null>(null)
  const long = useRef(false)
  const clear = () => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null }
  const start = () => { long.current = false; timer.current = window.setTimeout(() => { long.current = true; setMenu(true); simulatedFeedback() }, 550) }
  const move = (direction: number) => { const group = iconOrder.filter(item => DOCK_APPS.includes(item) === dock); const index = group.indexOf(id); const target = group[index + direction]; if (target) reorderIcons(id, target); setMenu(false) }
  return <div className={`app-button-wrap ${dock ? 'dock-app-wrap' : ''}`} draggable onDragStart={event => { clear(); event.dataTransfer.setData('text/plain', id); event.dataTransfer.effectAllowed = 'move' }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const from = event.dataTransfer.getData('text/plain') as AppId; if (apps[from] && DOCK_APPS.includes(from) === dock) reorderIcons(from, id) }}>
    <button type="button" className="app-button" aria-label={`Open ${apps[id].name}`} onPointerDown={start} onPointerUp={clear} onPointerCancel={clear} onPointerLeave={clear} onContextMenu={event => { event.preventDefault(); clear(); long.current = true; setMenu(true) }} onClick={() => { if (long.current) { long.current = false; return }; simulatedFeedback(); openApp(id) }}>
      <span className="app-icon-holder"><AppIcon id={id} size={dock ? 48 : 51}/>{settings.notifications && apps[id].badge && <span className="app-badge">{apps[id].badge}</span>}</span>{!dock && <span className="app-label">{t(apps[id].name)}</span>}
    </button>
    {menu && <><button className="menu-backdrop" aria-label="Close app menu" onClick={() => setMenu(false)}/><div className="app-context-menu"><strong>{t(apps[id].name)}</strong><button onClick={() => { setMenu(false); openApp(id) }}>{t('Open')}</button>{mode !== 'closed' && windows.length > 0 && <button onClick={() => { setMenu(false); addSplit(id) }}>{t('Open in Split View')}</button>}<button onClick={() => move(-1)}>Move earlier</button><button onClick={() => move(1)}>Move later</button></div></>}
  </div>
}

export function HomeScreen({ compact }: { compact: boolean }) {
  const { settings, widgets, iconOrder, setOverlay } = useSystemStore()
  const now = useNow(60000)
  const todayKey = dateKey(now)
  const todayEvents = useLiveQuery(async () => { try { return await db.events.where('date').equals(todayKey).toArray() } catch { return [] } }, [todayKey], [])
  const t = useT()
  const prefersReducedMotion = useReducedMotion()
  const reduced = settings.reduceMotion || !!prefersReducedMotion
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const visible = iconOrder.filter(id => !DOCK_APPS.includes(id))
  const dockOrder = iconOrder.filter(id => DOCK_APPS.includes(id))
  // Two adjacent home pages retain the familiar four-column visual order.
  const firstPage = visible.filter((_, index) => index % 4 < 2)
  const secondPage = visible.filter((_, index) => index % 4 >= 2)
  const locale = settings.language === 'fa' ? 'fa-IR' : 'en-US'
  return <div className={`home-screen ${compact ? 'home-compact' : ''}`}>
    <div className="home-content">
      <AnimatePresence initial={false}>{!compact && <motion.section key="today" className="today-view" aria-label="Today View" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: reduced ? 0 : .2 }}>
        <div className="today-heading"><div><span className="today-date">{now.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}</span><h2>{t(greeting)}<span className="greeting-dot">.</span></h2></div><button onClick={() => setOverlay('widgets')} aria-label={t('Edit widgets')} className="widget-edit"><MoreHorizontal size={18}/></button></div>
        <div className="widget-grid">
          {widgets.weather && <button className="widget weather-widget" onClick={() => useSystemStore.getState().openApp('weather')}><span className="widget-label">CUPERTINO</span><span className="weather-temp">21°</span><CloudSun className="widget-weather-icon" size={36} strokeWidth={1.4}/><span className="widget-bottom">{t('Mostly Sunny')}<br/><small>H:24° &nbsp; L:16°</small></span></button>}
          {widgets.calendar && <button className="widget calendar-widget" onClick={() => useSystemStore.getState().openApp('calendar')}><span className="widget-label">{now.toLocaleDateString(locale, { weekday: 'long' }).toUpperCase()}</span><strong>{new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(now)}</strong><span className="widget-bottom">{todayEvents[0]?.title ?? t('No events today')}<br/><small>{todayEvents.length ? `${todayEvents.length} ${todayEvents.length === 1 ? 'event' : 'events'}` : 'Enjoy your day'}</small></span></button>}
          {widgets.photo && <button className="widget photo-widget" onClick={() => useSystemStore.getState().openApp('photos')}><span className="photo-overlay"/><span className="photo-widget-label"><span>FEATURED PHOTO</span><strong>A little escape.</strong><small>Somewhere beautiful</small></span></button>}
        </div>
        <button className="today-search" onClick={() => useSystemStore.getState().openApp('safari')}><Search size={14}/><span>{t('Search')}</span></button>
      </motion.section>}</AnimatePresence>
      <motion.section layout transition={{ duration: reduced ? 0 : .3 }} className="home-apps" aria-label="Home Screen apps"><div className="apps-grid"><div className="home-page" aria-label="Home page 1">{firstPage.map(id => <AppButton key={id} id={id}/>)}</div><div className="home-page" aria-label="Home page 2">{secondPage.map(id => <AppButton key={id} id={id}/>)}</div></div><div className="home-page-dots"><span className="active"/><span/></div></motion.section>
    </div>
    <div className="dock" aria-label="Dock">{dockOrder.map(id => <AppButton key={id} id={id} dock/>)}</div>
    {compact && <div className="compact-home-hint"><Sun size={12}/> <span>Designed to unfold</span></div>}
    <span className="home-grip" aria-hidden="true"><Grip size={12}/></span>
  </div>
}

export function WidgetPicker() {
  const { widgets, toggleWidget, setOverlay } = useSystemStore()
  const t = useT()
  return <div className="overlay-scrim" onClick={() => setOverlay('none')}><div className="system-sheet widget-sheet" onClick={event => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-title"><h3>{t('Edit widgets')}</h3><button onClick={() => setOverlay('none')}>{t('Done')}</button></div><p>Choose what appears in Today View.</p>{([['weather', 'Weather', <CloudSun size={18}/>], ['calendar', 'Calendar', <CalendarDays size={18}/>], ['photo', 'Photos', <Sun size={18}/>]] as const).map(([id, label, icon]) => <button className="widget-choice" key={id} onClick={() => toggleWidget(id)}><span>{icon}{t(label)}</span><span className={`check-circle ${widgets[id] ? 'checked' : ''}`}>{widgets[id] ? '✓' : '+'}</span></button>)}</div></div>
}
