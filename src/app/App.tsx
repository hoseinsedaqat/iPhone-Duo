import { useEffect, useState } from 'react'
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

export function App() {
  const { mode, setMode, orientation, setOrientation, setLocked, locked, goHome, settings } = useSystemStore()
  const [showControls, setShowControls] = useState(true)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const t = useT()

  useEffect(() => { void db.open().catch(() => setError('Browser storage is unavailable. Some changes may not be saved.')) }, [])
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
        <button className="header-help" onClick={() => setShowHelp(!showHelp)} aria-expanded={showHelp}><CircleHelp size={17}/><span>Guide</span></button>
      </div>
    </header>
    {showHelp && <div className="help-popover" role="dialog" aria-label="Simulator guide">
      <button aria-label="Close help" onClick={() => setShowHelp(false)}><X size={16}/></button>
      <strong>Made to explore.</strong>
      <p>Open an app, use the home bar to return, or choose Split View from an app’s menu. Change the device pose below.</p>
      <small>Unofficial browser concept. Apple services, calls, and device security are not provided.</small>
    </div>}

    <main id="top" className="workspace">
      <section className="device-column" aria-label="Interactive iPhone Duo simulator">
        <h1 className="sr-only">iPhone Duo interactive simulator</h1>
        <div className="device-topline"><span className="display-badge"><i/>{mode === 'closed' ? '5.4″ Outer display' : '7.6″ Inner display'}</span></div>
        <DeviceFrame/>
      </section>

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
        <div className="quick-controls" aria-label="Screen controls">
          <button aria-label={locked ? 'Unlock screen' : 'Lock screen'} title={locked ? 'Unlock screen' : 'Lock screen'} onClick={() => setLocked(!locked)}><LockKeyhole size={18}/></button>
          <button aria-label="Home" title="Home" onClick={() => goHome()}><LayoutGrid size={18}/></button>
          <button aria-label="Reset simulator" title="Reset simulator" className="reset-button" onClick={() => void reset()}><RotateCcw size={17}/></button>
        </div>
      </aside>}
    </main>

    {error && <div className="site-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
    <footer className="site-footer">Unofficial web concept <span>·</span> Not affiliated with Apple.</footer>
    <div className="sr-only" aria-live="polite">{t(mode === 'closed' ? 'Closed' : 'Open')} · {settings.language}</div>
  </div>
}

function PoseIcon({ mode }: { mode: DeviceMode }) { return <span className={`pose-icon pose-${mode}`} aria-hidden="true"><i/><i/></span> }
