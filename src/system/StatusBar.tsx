import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { useSystemStore } from './store'
import { useNow } from '../utils/time'

export function StatusBar({ compact }: { compact: boolean }) {
  const now = useNow(10000)
  const { settings, setOverlay } = useSystemStore()
  return <div className={`status-bar ${compact ? 'status-compact' : ''}`}>
    <button className="status-time" aria-label="Open Notification Center" onClick={() => setOverlay('notifications')}>{now.toLocaleTimeString(settings.language === 'fa' ? 'fa-IR' : 'en-US', { hour: 'numeric', minute: '2-digit' })}</button>
    <div className="status-spacer" />
    {compact && <div className="outer-camera" aria-label="Simulated front camera"/>}
    <button className="status-indicators" aria-label="Open Control Center" onClick={() => setOverlay('control')}><Signal size={14} fill="currentColor"/>{settings.wifi && <Wifi size={14}/>}<BatteryFull size={19} fill="currentColor"/></button>
  </div>
}
