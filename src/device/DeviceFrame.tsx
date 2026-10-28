import { motion, useReducedMotion } from 'framer-motion'
import { useSystemStore } from '../system/store'
import { SystemScreen } from '../system/SystemScreen'

export function DeviceFrame() {
  const { mode, orientation, settings } = useSystemStore()
  const compact = mode === 'closed'
  const prefersReducedMotion = useReducedMotion()
  const reduced = settings.reduceMotion || !!prefersReducedMotion
  return <div className={`device-stage ${compact ? 'stage-closed' : ''} stage-${mode} orientation-${orientation}`}>
    <motion.div layout transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 25 }} className={`device-frame mode-${mode} ${orientation === 'landscape' ? 'landscape' : ''} ${reduced ? 'reduce-motion' : ''}`} data-testid="device-frame" data-mode={mode}>
      <span className="hardware-button hardware-button-one"/><span className="hardware-button hardware-button-two"/><span className="hardware-button hardware-power"/>
      <div className="device-bezel"><SystemScreen compact={compact}/></div>
      {!compact && <><div className="hinge-top"/><div className="hinge-bottom"/></>}
    </motion.div>
    <div className="device-floor-shadow"/>
  </div>
}
