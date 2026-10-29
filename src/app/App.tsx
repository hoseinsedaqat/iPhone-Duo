import { useEffect, useRef, useState } from 'react'
import { CircleHelp, Eye, EyeOff, LayoutGrid, LockKeyhole, RotateCcw, Smartphone, X } from 'lucide-react'
import { DeviceFrame } from '../device/DeviceFrame'
import { resetSimulator, db } from '../persistence/database'
import { useSystemStore } from '../system/store'
import type { DeviceMode } from '../system/types'
import { useT } from '../utils/i18n'

const modes: { id: DeviceMode; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'partial', label: 'Partially folded' },
  { id: 'tabletop', label: 'Tabletop' },
]

function DuoMark() { return <span className="duo-mark" aria-hidden="true"><i/><i/></span> }

type HomeFeedback = 'You are already on the Home Screen.' | 'Unlock the screen to return Home.'

export function App() {
  const { mode, setMode, orientation, setOrientation, setLocked, locked, goHome, settings, windows, overlay } = useSystemStore()
  const [showControls, setShowControls] = useState(true)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [homeFeedback, setHomeFeedback] = useState<HomeFeedback | null>(null)
  const helpAnchorRef = useRef<HTMLDivElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const helpCloseRef = useRef<HTMLButtonElement>(null)
  const homeFeedbackTimer = useRef<number | null>(null)
  const t = useT()
  const atHome = !locked && windows.length === 0 && overlay === 'none'
  const homeTitle = t(locked ? 'Unlock the screen to return Home.' : atHome ? 'You are already on the Home Screen.' : 'Return to Home Screen')

  useEffect(() => { void db.open().catch(() => setError('Browser storage is unavailable. Some changes may not be saved.')) }, [])
  useEffect(() => {
    setHomeFeedback(null)
    if (homeFeedbackTimer.current !== null) window.clearTimeout(homeFeedbackTimer.current)
  }, [locked, windows.length, overlay])
  useEffect(() => () => {
    if (homeFeedbackTimer.current !== null) window.clearTimeout(homeFeedbackTimer.current)
  }, [])
  useEffect(() => {
    if (!showHelp) return
    helpCloseRef.current?.focus({ preventScroll: true })
    const dismissOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !helpAnchorRef.current?.contains(event.target)) setShowHelp(false)
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHelp(false)
        helpButtonRef.current?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('pointerdown', dismissOnOutsidePress)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsidePress)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [showHelp])
  const returnHome = () => {
    if (locked || atHome) {
      if (homeFeedbackTimer.current !== null) window.clearTimeout(homeFeedbackTimer.current)
      setHomeFeedback(locked ? 'Unlock the screen to return Home.' : 'You are already on the Home Screen.')
      homeFeedbackTimer.current = window.setTimeout(() => setHomeFeedback(null), 4000)
      return
    }
    goHome()
  }
  const reset = async () => {
    if (window.confirm('Reset the simulator? All local notes, transactions, bookmarks and settings will be deleted.')) {
      try { await resetSimulator() } catch { setError('Could not reset local data. Please check browser storage permissions.') }
    }
  }

  return <div className="site-shell">
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Duo simulator home"><DuoMark/><span>duo</span><small>iPhone Duo simulator</small></a>
      <div className="header-right">
        <span className="header-caption">Unofficial concept</span>
        <button className="header-icon" aria-label={showControls ? 'Hide controls' : 'Show controls'} title={showControls ? 'Hide controls' : 'Show controls'} onClick={() => setShowControls(!showControls)}>{showControls ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
        <div className="help-anchor" ref={helpAnchorRef}>
          <button ref={helpButtonRef} className="header-help" onClick={() => setShowHelp(!showHelp)} aria-expanded={showHelp} aria-haspopup="dialog" aria-controls="simulator-guide"><CircleHelp size={17}/><span>Guide</span></button>
          {showHelp && <div id="simulator-guide" className="help-popover" role="dialog" aria-label="Simulator guide">
            <button ref={helpCloseRef} aria-label="Close help" onClick={() => { setShowHelp(false); helpButtonRef.current?.focus({ preventScroll: true }) }}><X size={16}/></button>
            <strong>Made to explore.</strong>
            <p>Open an app, use the home bar to return, or choose Split View from an app’s menu. The controls below the phone:</p>
            <ul className="help-controls">
              <li><LockKeyhole size={14}/><span><b>Lock</b> — simulates locking the screen.</span></li>
              <li><LayoutGrid size={14}/><span><b>Home</b> — closes open apps and goes to the Home Screen.</span></li>
              <li><RotateCcw size={14}/><span><b>Reset</b> — clears this browser’s simulator data.</span></li>
            </ul>
            <small>Unofficial browser concept. Apple services, calls, and device security are not provided.</small>
          </div>}
        </div>
      </div>
    </header>

    <main id="top" className="workspace">
      <section className="device-column" aria-label="Interactive iPhone Duo simulator">
        <h1 className="sr-only">iPhone Duo interactive simulator</h1>
        <div className="device-topline"><span className="display-badge"><i/>{mode === 'closed' ? '5.4″ Outer display' : '7.6″ Inner display'}</span></div>
        <DeviceFrame/>
        {showControls && <aside className="controls-column" aria-label="Device controls">
        <div className="control-section pose-section">
          <span className="control-label">Device position</span>
          <div className="pose-grid">{modes.map(item => <button key={item.id} aria-pressed={mode === item.id} className={`pose-button ${mode === item.id ? 'active' : ''}`} onClick={() => setMode(item.id)}><PoseIcon mode={item.id}/><span>{item.label}</span></button>)}</div>
        </div>
        <div className="control-divider"/>
        <div className="control-section orientation-section">
          <span className="control-label">Orientation</span>
          <div className="orientation-control"><button aria-pressed={orientation === 'portrait'} className={orientation === 'portrait' ? 'active' : ''} onClick={() => setOrientation('portrait')}><Smartphone size={15}/> Portrait</button><button aria-pressed={orientation === 'landscape'} className={orientation === 'landscape' ? 'active' : ''} onClick={() => setOrientation('landscape')}><Smartphone size={15} className="rotate-icon"/> Landscape</button></div>
        </div>
        <div className="control-divider"/>
        <div className="control-section quick-section">
          <span className="control-label">{t('Screen')}</span>
          <div className="quick-controls" aria-label="Screen controls">
            <button aria-label={locked ? 'Unlock screen' : 'Lock screen'} title={locked ? 'Unlock screen' : 'Lock screen'} onClick={() => setLocked(!locked)}><LockKeyhole size={18}/><span>{t(locked ? 'Unlock' : 'Lock')}</span></button>
            <button aria-label="Home" title={homeTitle} onClick={returnHome}><LayoutGrid size={18}/><span>{t('Home')}</span></button>
            <button aria-label="Reset simulator" title="Reset simulator" className="reset-button" onClick={() => void reset()}><RotateCcw size={17}/><span>{t('Reset')}</span></button>
          </div>
        </div>
        </aside>}
      </section>
      <span id="home-feedback" className={`home-feedback ${homeFeedback ? 'visible' : ''}`} role="status" aria-live="polite" dir={settings.language === 'fa' ? 'rtl' : 'ltr'}>{homeFeedback ? t(homeFeedback) : ''}</span>
    </main>

    {error && <div className="site-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
    <footer className="site-footer">Unofficial web concept <span>·</span> Not affiliated with Apple.</footer>
    <div className="sr-only" aria-live="polite">{t(mode === 'closed' ? 'Closed' : 'Open')} · {settings.language}</div>
  </div>
}

function PoseIcon({ mode }: { mode: DeviceMode }) { return <span className={`pose-icon pose-${mode}`} aria-hidden="true"><i/><i/></span> }
