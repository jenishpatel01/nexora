import { useSyncExternalStore } from 'react'
import type { ArenaId } from '../types'
import { arenas } from '../data/nexo'
import { cumulativeXp } from './progression'

export type ArenaStat = { elo: number; played: number; wins: number }
export type MatchRecord = {
  id: string; at: number; arena: ArenaId; opponent: string; result: 'win' | 'loss' | 'draw'
  playerScore: number; rivalScore: number; eloDelta: number; xp: number; durationSec: number; ranked: boolean
}
export type Profile = {
  /** the account this progress belongs to (empty for the offline demo profile) */
  uid?: string
  name: string
  elo: number
  xp: number
  streak: number
  bestStreak: number
  wins: number
  losses: number
  draws: number
  arena: Record<ArenaId, ArenaStat>
  history: MatchRecord[]
  trail: number[]
  achievements: Record<string, number>
  beaten: string[]
  nexoWins: number
  onboarded: boolean
  dailyDone: string | null
}

const KEY = 'nexora:profile:v2'
const DAY = 86400000

export function seedProfile(kind: 'default' | 'rankup' = 'default'): Profile {
  const now = Date.now()
  const arena = {} as Record<ArenaId, ArenaStat>
  const played = [34, 28, 31, 36, 42, 33]
  arenas.forEach((a, i) => { arena[a.id] = { elo: a.rating, played: played[i], wins: Math.round(played[i] * 0.58) } })
  const elo = kind === 'rankup' ? 1286 : 1248
  const hist = (n: number, ago: number, arenaId: ArenaId, opp: string, result: 'win' | 'loss', ps: number, rs: number, d: number): MatchRecord =>
    ({ id: `NX-20${n}`, at: now - ago * DAY, arena: arenaId, opponent: opp, result, playerScore: ps, rivalScore: rs, eloDelta: d, xp: result === 'win' ? 180 : 70, durationSec: 250 + n, ranked: true })
  return {
    name: 'JENISH', elo, xp: cumulativeXp(26) + 480, streak: 4, bestStreak: 6, wins: 118, losses: 86, draws: 0,
    arena,
    history: [
      hist(481, 0.1, 'mind', 'ORION', 'win', 91, 84, 24),
      hist(397, 0.6, 'debate', 'VEX', 'loss', 76, 81, -16),
      hist(284, 1.1, 'coding', 'ZERO', 'win', 100, 72, 28),
      hist(220, 1.8, 'knowledge', 'SAGE', 'win', 88, 70, 19),
      hist(158, 2.4, 'business', 'ATLAS', 'loss', 64, 79, -18),
      hist(102, 3.2, 'roast', 'NEXO', 'win', 82, 61, 17),
    ],
    trail: [1150, 1172, 1160, 1189, 1203, 1196, 1217, 1209, 1226, 1214, 1224, 1248].map((v) => (kind === 'rankup' ? v + 38 : v)),
    achievements: { 'first-battle': now - 90 * DAY, 'hot-hands': now - 3 * DAY, 'ai-hunter': now - 9 * DAY, 'code-master': now - 12 * DAY },
    beaten: ['zero', 'vex', 'sage', 'orion'],
    nexoWins: 3,
    onboarded: true,
    dailyDone: null,
  }
}

/** a brand-new player: Bronze-level rating, no history */
export function freshProfile(name: string, onboarded = false, uid?: string): Profile {
  const arena = {} as Record<ArenaId, ArenaStat>
  arenas.forEach((a) => { arena[a.id] = { elo: 1000, played: 0, wins: 0 } })
  return {
    uid, name, elo: 1000, xp: 0, streak: 0, bestStreak: 0, wins: 0, losses: 0, draws: 0,
    arena, history: [], trail: [1000], achievements: {}, beaten: [], nexoWins: 0, onboarded, dailyDone: null,
  }
}

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...seedProfile(), ...JSON.parse(raw) } as Profile
  } catch { /* storage unavailable */ }
  return seedProfile()
}

let state: Profile = load()
const listeners = new Set<() => void>()

export const getProfile = () => state
export const subscribeProfile = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }

export function setProfile(next: Profile) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

/**
 * A player signed in or signed up on this device. A new account starts fresh. Signing in as a different
 * account than the one whose progress is stored here also starts fresh, so people sharing a browser
 * do not share rank. Progress lives on this device only.
 */
export function adoptAccount(me: { uid: string; username: string }, isNew: boolean) {
  const cur = getProfile()
  if (isNew || cur.uid !== me.uid) setProfile(freshProfile(me.username, !isNew, me.uid))
  else if (cur.name !== me.username) setProfile({ ...cur, name: me.username })
}

export function resetProfile(kind: 'default' | 'rankup' = 'default') { setProfile(seedProfile(kind)) }

export const useProfile = () => useSyncExternalStore(subscribeProfile, getProfile, getProfile)
