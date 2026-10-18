import { useEffect, useRef, useState } from 'react'
import { motionReduced, useInView } from './hooks'

type Props = {
  to: number
  from?: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  /** wait until scrolled into view */
  onView?: boolean
  delay?: number
}

export function CountUp({ to, from = 0, duration = 1100, decimals = 0, prefix = '', suffix = '', onView = false, delay = 0 }: Props) {
  const [ref, seen] = useInView<HTMLSpanElement>()
  const [value, setValue] = useState(motionReduced() ? to : from)
  const start = useRef(from)
  const go = !onView || seen

  useEffect(() => {
    if (!go) return
    if (motionReduced()) { setValue(to); return }
    let frame = 0
    let timer = 0
    const a = start.current
    const run = () => {
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration)
        const e = 1 - Math.pow(1 - p, 3)
        const v = a + (to - a) * e
        setValue(v)
        start.current = v
        if (p < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }
    timer = window.setTimeout(run, delay)
    return () => { window.clearTimeout(timer); cancelAnimationFrame(frame) }
  }, [to, duration, go, delay])

  const shown = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString()
  return <span ref={ref} className="count">{prefix}{shown}{suffix}</span>
}
