import { getSettings } from '../settings'

export type Cue = 'hover' | 'click' | 'confirm' | 'match-start' | 'victory' | 'defeat' | 'achievement' | 'correct' | 'wrong' | 'tick' | 'rankup' | 'go'

let ctx: AudioContext | null = null

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number; to?: number }

const cues: Record<Cue, Note[]> = {
  hover: [{ f: 640, t: 0, d: 0.04, g: 0.03 }],
  click: [{ f: 420, t: 0, d: 0.07, g: 0.07, to: 300 }],
  confirm: [{ f: 520, t: 0, d: 0.08, g: 0.07 }, { f: 780, t: 0.07, d: 0.12, g: 0.07 }],
  'match-start': [{ f: 392, t: 0, d: 0.12, g: 0.08 }, { f: 523, t: 0.11, d: 0.12, g: 0.08 }, { f: 784, t: 0.22, d: 0.22, g: 0.09 }],
  go: [{ f: 660, t: 0, d: 0.1, g: 0.09 }, { f: 990, t: 0.09, d: 0.24, g: 0.09 }],
  victory: [{ f: 523, t: 0, d: 0.14, g: 0.08 }, { f: 659, t: 0.12, d: 0.14, g: 0.08 }, { f: 784, t: 0.24, d: 0.14, g: 0.08 }, { f: 1046, t: 0.36, d: 0.36, g: 0.09 }],
  defeat: [{ f: 392, t: 0, d: 0.18, g: 0.07, type: 'triangle' }, { f: 330, t: 0.16, d: 0.18, g: 0.07, type: 'triangle' }, { f: 262, t: 0.32, d: 0.3, g: 0.07, type: 'triangle' }],
  achievement: [{ f: 880, t: 0, d: 0.1, g: 0.07 }, { f: 1175, t: 0.09, d: 0.1, g: 0.07 }, { f: 1568, t: 0.18, d: 0.3, g: 0.07 }],
  rankup: [{ f: 440, t: 0, d: 0.12, g: 0.08 }, { f: 554, t: 0.11, d: 0.12, g: 0.08 }, { f: 659, t: 0.22, d: 0.12, g: 0.08 }, { f: 880, t: 0.33, d: 0.4, g: 0.09 }],
  correct: [{ f: 660, t: 0, d: 0.08, g: 0.07 }, { f: 880, t: 0.07, d: 0.14, g: 0.07 }],
  wrong: [{ f: 220, t: 0, d: 0.18, g: 0.06, type: 'sawtooth', to: 160 }],
  tick: [{ f: 900, t: 0, d: 0.03, g: 0.03 }],
}

/** Optional UI sounds. Off by default and only runs after the player turns it on in Settings. */
export function sfx(cue: Cue) {
  if (!getSettings().sound || typeof window === 'undefined') return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    for (const n of cues[cue]) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = n.type ?? 'sine'
      o.frequency.setValueAtTime(n.f, now + n.t)
      if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, now + n.t + n.d)
      g.gain.setValueAtTime(0.0001, now + n.t)
      g.gain.exponentialRampToValueAtTime(n.g ?? 0.06, now + n.t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d)
      o.connect(g).connect(ctx.destination)
      o.start(now + n.t)
      o.stop(now + n.t + n.d + 0.02)
    }
  } catch { /* audio unavailable */ }
}
