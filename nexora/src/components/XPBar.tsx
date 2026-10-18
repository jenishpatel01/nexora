import { useEffect, useState } from 'react'
import { motionReduced } from '../motion/hooks'

type Props = {
  /** 0..1 */
  value: number
  from?: number
  color?: 'mint' | 'lavender' | 'peach' | 'blue'
  label: string
  height?: number
  delay?: number
}

/** Animated fill bar. Fills from `from` to `value` on mount and whenever value changes. */
export function XPBar({ value, from = 0, color = 'mint', label, height = 12, delay = 120 }: Props) {
  const [v, setV] = useState(motionReduced() ? value : from)
  useEffect(() => {
    if (motionReduced()) { setV(value); return }
    const t = window.setTimeout(() => setV(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  const pct = Math.round(Math.max(0, Math.min(1, v)) * 100)
  return (
    <div className={`xpbar xpbar-${color}`} style={{ height }} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <i style={{ transform: `scaleX(${Math.max(0, Math.min(1, v))})` }} />
    </div>
  )
}
