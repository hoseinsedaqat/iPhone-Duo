import type { AppId } from '../system/types'
import { useSystemStore } from '../system/store'
import { useNow } from '../utils/time'

interface Props { id: AppId; size?: number; className?: string }

// Original vector artwork, inspired by familiar mobile app metaphors rather
// than bundled Apple assets. All artwork scales with the launcher icon.
export function AppIcon({ id, size = 54, className = '' }: Props) {
  const language = useSystemStore(state => state.settings.language)
  let art: React.ReactNode
  switch (id) {
    case 'safari':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="#fdfefe"/><circle cx="32" cy="32" r="24" fill="#168ef2"/><circle cx="32" cy="32" r="20.5" fill="#35b5fa"/>{Array.from({ length: 24 }, (_, i) => <line key={i} x1="32" y1="10.5" x2="32" y2={i % 6 === 0 ? '14.2' : '12.6'} stroke="#fff" strokeWidth={i % 6 === 0 ? 1.2 : .65} opacity=".9" transform={`rotate(${i * 15} 32 32)`}/>)}<path d="M43.5 19.5 35 35l-14.5 9.5L29 29z" fill="#fff"/><path d="m43.5 19.5-8.5 15.5-6-6z" fill="#f34e55"/><circle cx="32" cy="32" r="1.6" fill="#f5f8ff"/></svg>; break
    case 'calendar': {
      const date = new Date(); const locale = language === 'fa' ? 'fa-IR' : 'en-US'
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><text x="32" y="18" textAnchor="middle" fill="#f04d55" fontSize="10" fontWeight="650" fontFamily="system-ui, sans-serif">{date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase()}</text><text x="32" y="51" textAnchor="middle" fill="#17191d" fontSize="31" fontWeight="350" fontFamily="system-ui, sans-serif">{date.toLocaleDateString(locale, { day: 'numeric' })}</text></svg>; break
    }
    case 'photos':
      art = <svg viewBox="0 0 64 64" aria-hidden="true">{['#ff4b55', '#ff913b', '#ffca3e', '#b1d93f', '#44c889', '#3abce7', '#6089e8', '#d75abe'].map((color, i) => <ellipse key={color} cx="32" cy="19.8" rx="7.1" ry="13.8" fill={color} opacity=".88" transform={`rotate(${i * 45} 32 32)`}/>)}<circle cx="32" cy="32" r="3.3" fill="#f5dca7" opacity=".75"/></svg>; break
    case 'camera':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 21a5 5 0 0 1 5-5h5l3-5h13l3 5h4a5 5 0 0 1 5 5v23a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5z" fill="#30343a"/><circle cx="32" cy="31.5" r="12.7" fill="#171b20"/><circle cx="32" cy="31.5" r="9.5" fill="#535b64"/><circle cx="32" cy="31.5" r="6.4" fill="#202833"/><circle cx="30" cy="29.3" r="2.5" fill="#8ba3bb" opacity=".55"/><circle cx="45.5" cy="21.5" r="2" fill="#e0e5e7"/></svg>; break
    case 'clock': art = <ClockArtwork/>; break
    case 'appstore':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 43h26M24 48l16-29M23 19l7.5 13M37 39l5.5 9" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>; break
    case 'notes':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="0" y="0" width="64" height="16" fill="#f9d750"/><path d="M0 16h64" stroke="#e5c34b" strokeWidth="1"/><path d="M9 27h46M9 36h46M9 45h46M9 54h46" stroke="#d6d6d1" strokeWidth="1.2"/></svg>; break
    case 'files':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 19a4 4 0 0 1 4-4h14l4 5h18a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#087ed7"/><path d="M10 25a4 4 0 0 1 4-4h36a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#43b5f9"/><path d="M12 27h40" stroke="#82d7ff" strokeWidth="1.5" opacity=".8"/></svg>; break
    case 'weather':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#ffd65a" strokeWidth="2" strokeLinecap="round">{Array.from({ length: 8 }, (_, i) => <line key={i} x1="37" y1="9" x2="37" y2="12" transform={`rotate(${i * 45} 37 24)`}/>)}</g><circle cx="37" cy="24" r="10" fill="#ffca44"/><path d="M18 47a9 9 0 0 1-.5-18 12 12 0 0 1 23-1.5A9 9 0 0 1 45 45c-1.2 1.3-3.3 2-5.5 2z" fill="#eaf5ff"/><path d="M18 47h22" stroke="#ccdfef" strokeWidth="1.3"/></svg>; break
    case 'accounting':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="33" width="7" height="17" rx="2" fill="#e3fff0" opacity=".7"/><rect x="26" y="26" width="7" height="24" rx="2" fill="#e3fff0" opacity=".85"/><rect x="38" y="18" width="7" height="32" rx="2" fill="#fff"/><path d="m12 25 13-6 8 3 15-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>; break
    case 'maps':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#e9f0de"/><path d="M0 0h26L18 24 0 29zM42 0h22v22L49 27zM0 47l15-7 10 24H0z" fill="#b7dea3"/><path d="M44 64 32 39 64 25v39z" fill="#b9dff1"/><path d="M-4 17 68 47M12 67 43-3" fill="none" stroke="#fff" strokeWidth="8"/><path d="M-4 17 68 47M12 67 43-3" fill="none" stroke="#d4d3c8" strokeWidth="1"/><path d="M7 61 25 39 54 11" fill="none" stroke="#f2b45d" strokeWidth="4"/><path d="M31 30 39 26l5 9-8 4z" fill="#428ee2"/><path d="m36 28 3 7-5-1z" fill="#fff"/></svg>; break
    case 'calculator':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="20" r="9" fill="#b7b8bc"/><circle cx="44" cy="20" r="9" fill="#b7b8bc"/><circle cx="20" cy="44" r="9" fill="#7d7f83"/><circle cx="44" cy="44" r="9" fill="#f6a332"/><path d="M16 20h8m-4-4v8m20-4h8M17 41l6 6m0-6-6 6m23 1h8m-8 4h8" stroke="#fff" strokeWidth="2.1" strokeLinecap="round"/></svg>; break
    case 'settings':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><g fill="#555b61">{Array.from({ length: 12 }, (_, i) => <rect key={i} x="28.3" y="7" width="7.4" height="12" rx="2.5" transform={`rotate(${i * 30} 32 32)`}/>)}</g><circle cx="32" cy="32" r="19" fill="#555b61"/><circle cx="32" cy="32" r="15.2" fill="#c7cbce"/><circle cx="32" cy="32" r="11.5" fill="#6a7075"/><circle cx="32" cy="32" r="7.2" fill="#aeb4b8"/><circle cx="32" cy="32" r="4.2" fill="#646b70"/></svg>; break
    case 'wallet':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="9" y="12" width="46" height="38" rx="7" fill="#f07d37"/><path d="M9 20a5 5 0 0 1 5-5h36a5 5 0 0 1 5 5v7H9z" fill="#f4c64d"/><path d="M9 25a5 5 0 0 1 5-5h36a5 5 0 0 1 5 5v8H9z" fill="#53c979"/><path d="M9 31a5 5 0 0 1 5-5h36a5 5 0 0 1 5 5v8H9z" fill="#4ba7ef"/><rect x="7" y="34" width="50" height="20" rx="6" fill="#343a44"/><path d="M7 40a6 6 0 0 1 6-6h38a6 6 0 0 1 6 6" fill="none" stroke="#626974" strokeWidth="1"/></svg>; break
    case 'messages':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 12c-13.3 0-23 8-23 18.7 0 6.1 3.2 11.3 8.5 14.7-.4 3-1.7 5.3-4.1 7.6 5.8-.2 10.2-1.9 13-4.2 1.8.4 3.7.6 5.6.6 13.4 0 23-8 23-18.7S45.4 12 32 12z" fill="#fff"/></svg>; break
    case 'phone':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 10c-2.5 0-6.8 4.1-7.2 7.1-.7 5.8 5.1 15.2 11.8 21.8 6.7 6.7 16.1 12.5 21.8 11.7 3-.4 7.1-4.7 7.1-7.2 0-1.2-1-2.1-2.1-2.8l-7-4.2c-1.6-1-3-.8-4.4.4l-3.3 3c-3.1-1.2-6.3-3.8-9-6.5-2.7-2.7-5.3-5.9-6.5-9l3-3.3c1.2-1.4 1.4-2.8.4-4.4l-4.2-7C21.1 11 20.2 10 19 10z" fill="#fff"/></svg>; break
    case 'music':
      art = <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M28 19v25.2c0 4.2-3.2 6.9-7.8 6.9-3.7 0-6.2-1.9-6.2-5 0-3.5 3.1-5.9 7.3-5.9 1 0 1.8.1 2.6.3V19c0-2.3 1.4-3.9 3.6-4.4l19-4.5c2.4-.5 3.7.6 3.7 2.8v25c0 4.3-3.2 7-7.8 7-3.7 0-6.2-1.9-6.2-5 0-3.5 3.1-5.9 7.3-5.9.9 0 1.8.1 2.6.3V20z" fill="#fa4165"/></svg>; break
  }
  return <span className={`app-icon icon-${id} ${className}`} style={{ width: size, height: size, borderRadius: size * .225 }} aria-hidden="true">{art}</span>
}

function ClockArtwork() {
  const now = useNow(60_000)
  const minute = now.getMinutes()
  const hour = (now.getHours() % 12) * 30 + minute / 2
  return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26.5" fill="#fff"/>{Array.from({ length: 12 }, (_, i) => <line key={i} x1="32" y1="9" x2="32" y2={i % 3 === 0 ? '13' : '11.5'} stroke="#24262a" strokeWidth={i % 3 === 0 ? 1.6 : .8} transform={`rotate(${i * 30} 32 32)`}/>)}<path d="M32 32V19" fill="none" stroke="#24262a" strokeWidth="2.6" strokeLinecap="round" transform={`rotate(${hour} 32 32)`}/><path d="M32 33V14" fill="none" stroke="#24262a" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${minute * 6} 32 32)`}/><path d="M32 36V11" stroke="#f3a53a" strokeWidth="1" transform={`rotate(${minute * 6 + 36} 32 32)`}/><circle cx="32" cy="32" r="1.6" fill="#f3a53a"/></svg>
}
