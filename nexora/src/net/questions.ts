import type { ArenaId } from '../types'
import type { Round } from '../game/types'
import { apiBase } from './config'

const SEEN_KEY = 'nexora:seen:v1'
const SEEN_MAX = 30

type Seen = Partial<Record<ArenaId, string[]>>
const readSeen = (): Seen => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') as Seen } catch { return {} } }

/** short text that identifies a round, used to steer the AI away from questions this player already saw */
export const keyOf = (r: Round): string => {
  const t = r.kind === 'quiz' ? r.prompt + (r.code ? ` ${r.code}` : '') : r.kind === 'pick' ? r.quote || r.context : ''
  return t.replace(/\s+/g, ' ').slice(0, 80)
}

export function rememberSeen(arena: ArenaId, items: Round[]) {
  try {
    const seen = readSeen()
    const now = items.map(keyOf).filter(Boolean)
    seen[arena] = [...now, ...(seen[arena] ?? []).filter((k) => !now.includes(k))].slice(0, SEEN_MAX)
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
  } catch { /* storage unavailable: repeats are only a little more likely */ }
}

/** fresh AI-written rounds for an arena, or null when the server has none (the game then uses its built-in questions) */
export async function fetchQuestions(arena: ArenaId): Promise<Round[] | null> {
  try {
    const res = await fetch(`${apiBase()}/api/rounds`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ arena, avoid: (readSeen()[arena] ?? []).slice(0, 24) }),
      signal: AbortSignal.timeout(14000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { items?: Round[] }
    const items = Array.isArray(data.items) ? data.items : []
    return items.length ? items : null
  } catch { return null }
}

/* The next match starts a fetch as soon as the player presses play, so the questions are ready by the end of the countdown. */
let pending: { arena: ArenaId; promise: Promise<Round[] | null>; at: number; used: boolean } | null = null

export function prefetchQuestions(arena: ArenaId) {
  pending = { arena, promise: fetchQuestions(arena), at: Date.now(), used: false }
}

/** the prefetched questions for this arena if there are fresh ones, otherwise a new request */
export function questionsFor(arena: ArenaId): { promise: Promise<Round[] | null>; consume: () => void } {
  const p = pending
  if (p && p.arena === arena && !p.used && Date.now() - p.at < 90000) return { promise: p.promise, consume: () => { p.used = true } }
  return { promise: fetchQuestions(arena), consume: () => {} }
}
