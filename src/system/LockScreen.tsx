import { Camera, Flashlight, LockKeyhole } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSystemStore } from './store'
import { useNow } from '../utils/time'
import { useT } from '../utils/i18n'

export function LockScreen() {
  const { settings, setLocked, openApp } = useSystemStore()
  const t = useT(); const now = useNow(1000)
  const [passcodeView, setPasscodeView] = useState(false)
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)
  const [dimmed, setDimmed] = useState(false); const [wakeCount, setWakeCount] = useState(0)
  useEffect(() => { if (!settings.alwaysOn || passcodeView) { setDimmed(false); return }; const timer = window.setTimeout(() => setDimmed(true), 15000); return () => window.clearTimeout(timer) }, [settings.alwaysOn, passcodeView, wakeCount])
  const startY = useRef<number | null>(null)
  const locale = settings.language === 'fa' ? 'fa-IR' : 'en-US'
  const unlock = () => { if (settings.passcode) setPasscodeView(true); else setLocked(false) }
  const digit = (n: string) => {
    const next = digits + n; setDigits(next); setError(false)
    if (next.length === 4) {
      if (next === '1234') { setTimeout(() => setLocked(false), 140) }
      else { setError(true); setTimeout(() => setDigits(''), 350) }
    }
  }
  return <div className={`lock-screen ${dimmed ? 'always-dimmed' : ''}`} onPointerDown={e => { if (dimmed) { setDimmed(false); setWakeCount(value => value + 1) }; startY.current = e.clientY }} onPointerUp={e => { if (startY.current !== null && startY.current - e.clientY > 45 && !passcodeView) unlock(); startY.current = null }}>
    {!passcodeView ? <><div className="lock-main"><LockKeyhole size={17} fill="white"/><div className="lock-date">{now.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}</div><div className="lock-time">{now.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</div></div><div className="lock-controls"><button aria-label="Flashlight simulation" onClick={() => document.querySelector('.device-screen')?.classList.toggle('flashlight-on')}><Flashlight size={19}/></button><button aria-label="Open Camera" onClick={() => openApp('camera')}><Camera size={21}/></button></div><button className="unlock-hint" onClick={unlock}>{t('Swipe up or click to unlock')}</button></> : <div className="passcode"><LockKeyhole size={22}/><h2>{t('Enter simulated passcode')}</h2><p>{t('This is not device security.')} Demo: 1234</p><div className={`passcode-dots ${error ? 'error' : ''}`}>{[0, 1, 2, 3].map(i => <span key={i} className={i < digits.length ? 'filled' : ''}/>)}</div><div className="passcode-grid">{['1','2','3','4','5','6','7','8','9','','0','⌫'].map((n, i) => n ? <button key={i} onClick={() => n === '⌫' ? setDigits(digits.slice(0, -1)) : digit(n)}>{n}</button> : <span key={i}/>)}</div><button className="passcode-cancel" onClick={() => { setPasscodeView(false); setDigits('') }}>{t('Cancel')}</button></div>}
  </div>
}
