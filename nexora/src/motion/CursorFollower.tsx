import { useEffect, useRef, useState } from 'react'
import { useFinePointer, motionReduced } from './hooks'
import { magnetCenter } from './magnet'
import { sfx } from './sound'

type Mode = 'default' | 'button' | 'card' | 'text' | 'game'

const interactive = 'button, a, [role="button"], summary, label[for], [data-cursor]'
const field = 'input, textarea, select'

/** Soft dot + larger follower. Desktop fine pointers only. */
export function CursorFollower() {
  const fine = useFinePointer()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('default')
  const [pressed, setPressed] = useState(false)
  const [shown, setShown] = useState(false)
  const active = fine && !motionReduced()

  useEffect(() => {
    if (!active) return
    document.documentElement.classList.add('has-cursor')
    const target = { x: -100, y: -100 }
    const follow = { x: -100, y: -100 }
    let frame = 0
    let pull: { x: number; y: number } | null = null

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      target.x = e.clientX
      target.y = e.clientY
      setShown(true)
      const t = e.target as Element | null
      const f = t?.closest(field)
      const el = t?.closest<HTMLElement>(interactive)
      let next: Mode = 'default'
      if (f) next = 'text'
      else if (el) next = el.dataset.cursor === 'card' || el.classList.contains('world-card') ? 'card' : el.dataset.cursor === 'game' ? 'game' : 'button'
      setMode((m) => (m === next ? m : next))
      pull = el ? magnetCenter(el) : null
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      setPressed(true)
      const r = document.createElement('span')
      r.className = 'cursor-ripple'
      r.style.left = `${e.clientX}px`
      r.style.top = `${e.clientY}px`
      document.body.appendChild(r)
      window.setTimeout(() => r.remove(), 620)
      if ((e.target as Element | null)?.closest(interactive)) sfx('click')
    }
    const up = () => setPressed(false)
    const leave = () => setShown(false)

    const tick = () => {
      const tx = pull ? target.x + (pull.x - target.x) * 0.28 : target.x
      const ty = pull ? target.y + (pull.y - target.y) * 0.28 : target.y
      follow.x += (tx - follow.x) * 0.18
      follow.y += (ty - follow.y) * 0.18
      if (dot.current) dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`
      if (ring.current) ring.current.style.transform = `translate3d(${follow.x}px, ${follow.y}px, 0)`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [active])

  if (!active) return null
  return (
    <div className={`cursor cursor-${mode} ${pressed ? 'is-pressed' : ''} ${shown ? 'is-shown' : ''}`} aria-hidden="true">
      <div className="cursor-ring" ref={ring}><i /></div>
      <div className="cursor-dot" ref={dot}><i /></div>
    </div>
  )
}
