import { useReducedMotion } from 'framer-motion'
import { useSystemStore } from '../system/store'
import { SystemScreen } from '../system/SystemScreen'

export function DeviceFrame() {
  const { mode, orientation, settings } = useSystemStore()
  const compact = mode === 'closed'
  const prefersReducedMotion = useReducedMotion()
  const reduced = settings.reduceMotion || !!prefersReducedMotion
  // CSS owns the pose transform; layout projection would overwrite it inline.
  return <div className={`device-stage ${compact ? 'stage-closed' : ''} stage-${mode} orientation-${orientation}`}>
    <div className={`device-frame mode-${mode} ${orientation === 'landscape' ? 'landscape' : ''} ${reduced ? 'reduce-motion' : ''}`} data-testid="device-frame" data-mode={mode}>
      <span className="hardware-button hardware-button-one"/><span className="hardware-button hardware-button-two"/><span className="hardware-button hardware-power"/>
      <div className="device-bezel"><SystemScreen compact={compact}/></div>
      {!compact && <><div className="hinge-top"/><div className="hinge-bottom"/></>}
    </div>
    <div className="device-floor-shadow"/>
  </div>
}
