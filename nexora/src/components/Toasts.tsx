import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { achievementById } from '../game/achievements'
import { Icon } from './Icon'
import { sfx } from '../motion/sound'

type Toast = { id: number; kind: 'info' | 'achievement'; text: string; sub?: string; xp?: number; out?: boolean }
type Ctx = { notify: (text: string) => void; achievement: (id: string) => void }

const ToastCtx = createContext<Ctx>({ notify: () => {}, achievement: () => {} })
export const useToasts = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const nextId = useRef(1)

  const push = useCallback((t: Omit<Toast, 'id'>, ms: number) => {
    const id = nextId.current++
    setItems((l) => [...l.slice(-2), { ...t, id }])
    window.setTimeout(() => setItems((l) => l.map((x) => (x.id === id ? { ...x, out: true } : x))), ms)
    window.setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), ms + 380)
  }, [])

  const value = useMemo<Ctx>(() => ({
    notify: (text) => push({ kind: 'info', text }, 2200),
    achievement: (id) => {
      const a = achievementById(id)
      sfx('achievement')
      push({ kind: 'achievement', text: a.name, sub: a.note, xp: a.xp }, 4200)
    },
  }), [push])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => t.kind === 'achievement' ? (
          <div key={t.id} className={`toast achievement ${t.out ? 'is-out' : ''}`}>
            <span className="t-ico"><Icon name="trophy" size={26} /></span>
            <span><small>Achievement unlocked</small><b>{t.text}</b></span>
            <em>+{t.xp} XP</em>
          </div>
        ) : (
          <div key={t.id} className={`toast ${t.out ? 'is-out' : ''}`}><span className="t-ico"><Icon name="check" size={18} /></span>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
