import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" className={`ios-toggle ${checked ? 'is-on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} disabled={disabled}><span /></button>
}
export function SettingsRow({ icon, label, value, onClick, children, color }: { icon?: ReactNode; label: string; value?: string; onClick?: () => void; children?: ReactNode; color?: string }) {
  const content = <>{icon && <span className="settings-row-icon" style={{ background: color }}>{icon}</span>}<span className="settings-row-label">{label}</span>{value && <span className="settings-row-value">{value}</span>}{children}{onClick && <ChevronRight size={16} className="row-chevron"/>}</>
  return onClick ? <button type="button" className="settings-row" onClick={onClick}>{content}</button> : <div className="settings-row">{content}</div>
}
export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return <div className="empty-state"><div>{icon}</div><strong>{title}</strong>{text && <p>{text}</p>}</div>
}
