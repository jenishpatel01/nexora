import { useEffect, useRef, useState, type RefObject } from 'react'
import { getSettings, useSettings } from '../settings'

export function osReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** true when motion should be reduced, from the OS preference or the in-app toggle */
export function motionReduced() {
  return osReducedMotion() || !getSettings().motion
}

export function useReducedMotion() {
  const settings = useSettings()
  const [os, setOs] = useState(osReducedMotion)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setOs(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return os || !settings.motion
}

export function useFinePointer() {
  const [fine, setFine] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine) and (hover: hover)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (hover: hover)')
    const fn = () => setFine(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return fine
}

export function useInView<T extends Element>(opts: IntersectionObserverInit & { once?: boolean } = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  const { once = true, ...io } = opts
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); if (once) obs.disconnect() }
      else if (!once) setSeen(false)
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px', ...io })
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [once])
  return [ref, seen]
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
