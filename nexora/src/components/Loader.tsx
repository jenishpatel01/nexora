import type { ArenaId, Mood } from '../types'
import { Nexo } from './Nexo'

const tone: Record<ArenaId | 'app', string> = {
  app: 'var(--lav)', coding: 'var(--mint)', debate: 'var(--pink)', roast: 'var(--peach)', business: 'var(--blue)', knowledge: '#ffcf8a', mind: 'var(--lav)',
}

export function ContextLoader({ message, arena = 'app', mood = 'think', overlay = true }: { message: string; arena?: ArenaId | 'app'; mood?: Mood; overlay?: boolean }) {
  return (
    <div className={`loader ${overlay ? 'is-overlay' : ''}`} style={{ ['--tone' as string]: tone[arena] }} role="status" aria-live="polite">
      <Nexo mood={mood} size={140} interactive={false} />
      <p className="loader-msg">{message}</p>
      <span className="loader-bar" aria-hidden="true"><i /></span>
    </div>
  )
}
