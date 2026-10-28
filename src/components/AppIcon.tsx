import { Camera, CloudSun, FileText, Folder, Map, MessageCircle, Music2, Phone, Settings } from 'lucide-react'
import type { AppId } from '../system/types'
import { useSystemStore } from '../system/store'

interface Props { id: AppId; size?: number; className?: string }
export function AppIcon({ id, size = 54, className = '' }: Props) {
  const language = useSystemStore(state => state.settings.language)
  const common = { size: size * 0.53, strokeWidth: 1.85, 'aria-hidden': true as const }
  let art: React.ReactNode
  switch (id) {
    case 'safari': art = <svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="safariBlue" x2="0" y2="1"><stop stopColor="#66d4ff"/><stop offset="1" stopColor="#0877ef"/></linearGradient></defs><circle cx="32" cy="32" r="27" fill="url(#safariBlue)" stroke="white" strokeWidth="2"/><circle cx="32" cy="32" r="21.5" fill="none" stroke="white" strokeWidth="1" strokeDasharray="1 3.6"/><path d="M41 20 34.5 34.5 22 44l6.5-15z" fill="#f85059"/><path d="m22 44 12.5-9.5L41 20 35 34z" fill="white" opacity=".95"/></svg>; break
    case 'calendar': { const date = new Date(); const locale = language === 'fa' ? 'fa-IR' : 'en-US'; art = <div className="calendar-icon-inner"><span>{date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase()}</span><strong>{date.toLocaleDateString(locale, { day: 'numeric' })}</strong></div>; break }
    case 'photos': art = <svg viewBox="0 0 64 64" aria-hidden="true">{['#ff4c55','#ff9843','#f9d64b','#91cf59','#51c3a5','#46bdec','#7588e9','#d777d6'].map((color, i) => <ellipse key={color} cx="32" cy="19" rx="7.2" ry="14.2" fill={color} opacity=".86" transform={`rotate(${i * 45} 32 32)`}/>)}</svg>; break
    case 'camera': art = <Camera {...common} strokeWidth={2.2}/>; break
    case 'clock': art = <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="#fff"/>{Array.from({ length: 12 }, (_, i) => <line key={i} x1="32" y1="8" x2="32" y2={i % 3 === 0 ? '12' : '10'} stroke="#2c3038" strokeWidth="1.5" transform={`rotate(${i * 30} 32 32)`}/>)}<path d="M32 18v15l10 6" fill="none" stroke="#252932" strokeWidth="2.6" strokeLinecap="round"/><path d="M32 35 25 45" stroke="#ff9a30" strokeWidth="1.4"/><circle cx="32" cy="32" r="2" fill="#ff9a30"/></svg>; break
    case 'appstore': art = <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 42h28M23 49l17-30M18 20l22 30" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"/></svg>; break
    case 'notes': art = <><div className="notes-icon-top"/><FileText {...common} strokeWidth={1.5}/></>; break
    case 'files': art = <Folder {...common} fill="#45a8f6" stroke="#177bd5" strokeWidth={1.5}/>; break
    case 'weather': art = <CloudSun {...common} color="#fff" fill="#ffffff55"/>; break
    case 'accounting': art = <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="33" width="7" height="15" rx="2" fill="white" opacity=".65"/><rect x="25" y="26" width="7" height="22" rx="2" fill="white" opacity=".8"/><rect x="36" y="18" width="7" height="30" rx="2" fill="white"/><path d="M13 24 26 18l8 3 13-9" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>; break
    case 'maps': art = <><div className="map-icon-lines"/><Map {...common} color="#f9fcff" strokeWidth={1.7}/></>; break
    case 'calculator': art = <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="11" y="11" width="19" height="19" rx="5" fill="#b5b5b7"/><rect x="34" y="11" width="19" height="19" rx="5" fill="#a7a7a9"/><rect x="11" y="34" width="19" height="19" rx="5" fill="#858589"/><rect x="34" y="34" width="19" height="19" rx="5" fill="#f4a32c"/><path d="M16 20.5h9M20.5 16v9M39 20.5h9M16 43.5h9M39 41h9M39 46h9" stroke="white" strokeWidth="2.4" strokeLinecap="round"/></svg>; break
    case 'settings': art = <Settings {...common} size={size * .6} color="#fff" strokeWidth={2.3}/>; break
    case 'wallet': art = <div className="wallet-cards"><i/><i/><i/><i/></div>; break
    case 'messages': art = <MessageCircle {...common} size={size * .59} fill="white" stroke="white"/>; break
    case 'phone': art = <Phone {...common} fill="white" stroke="white"/>; break
    case 'music': art = <Music2 {...common} fill="white" stroke="white"/>; break
  }
  return <span className={`app-icon icon-${id} ${className}`} style={{ width: size, height: size, borderRadius: size * .225 }} aria-hidden="true">{art}</span>
}
