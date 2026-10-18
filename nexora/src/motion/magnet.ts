import { motionReduced } from './hooks'

type Item = { el: HTMLElement; strength: number }
const items = new Set<Item>()
let bound = false
let frame = 0
let px = -9999
let py = -9999

const MAX = 6
const RADIUS = 96

function tick() {
  frame = 0
  for (const { el, strength } of items) {
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = px - cx
    const dy = py - cy
    const reach = Math.max(r.width, r.height) / 2 + RADIUS
    if (Math.hypot(dx, dy) < reach) {
      const mx = Math.max(-MAX, Math.min(MAX, dx * strength))
      const my = Math.max(-MAX, Math.min(MAX, dy * strength))
      el.style.setProperty('--mx', `${mx.toFixed(2)}px`)
      el.style.setProperty('--my', `${my.toFixed(2)}px`)
    } else {
      el.style.setProperty('--mx', '0px')
      el.style.setProperty('--my', '0px')
    }
  }
}

function onMove(e: PointerEvent) {
  if (e.pointerType === 'touch') return
  px = e.clientX
  py = e.clientY
  if (!frame) frame = requestAnimationFrame(tick)
}

/** Subtle magnetic pull toward the pointer (max 6px). Desktop pointers only. */
export function registerMagnet(el: HTMLElement, strength = 0.12) {
  if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches || motionReduced()) return () => {}
  const item = { el, strength }
  items.add(item)
  if (!bound) { window.addEventListener('pointermove', onMove, { passive: true }); bound = true }
  return () => {
    items.delete(item)
    el.style.removeProperty('--mx')
    el.style.removeProperty('--my')
    if (!items.size && bound) { window.removeEventListener('pointermove', onMove); bound = false }
  }
}

/** Current magnet pull for the cursor follower: returns the center of the closest magnetic element under the pointer. */
export function magnetCenter(target: Element | null): { x: number; y: number } | null {
  const el = target?.closest<HTMLElement>('[data-magnetic]')
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
