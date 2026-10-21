import { useCallback } from 'react'
import type { ArenaId } from '../types'
import { arenaById, arenas, nexo, opponentById } from '../data/nexo'
import type { Opponent } from '../types'
import { useApp, type SessionKind } from './context'
import type { Round } from '../game/types'
import { prefetchQuestions } from '../net/questions'

export const todayKey = () => new Date().toISOString().slice(0, 10)

/** daily challenge rotates through the arenas by calendar day */
export function dailyArena(): ArenaId {
  const d = Math.floor(Date.now() / 86400000)
  return arenas[d % arenas.length].id
}

export function useStart() {
  const { go, setSession } = useApp()
  /** search for a human opponent; falls back to NEXO */
  const findMatch = useCallback((arena: ArenaId, mode?: string) => {
    setSession({ arena, opponentId: 'nexo', kind: 'online', ranked: true, mode: mode ?? arenaById(arena).modes[0] })
    go('matchmaking', { arena })
  }, [go, setSession])

  const play = useCallback((arena: ArenaId, opponentId: string, kind: SessionKind = 'nexo', opts: { ranked?: boolean; mode?: string } = {}) => {
    setSession({ arena, opponentId, kind, ranked: opts.ranked ?? (kind !== 'practice' && kind !== 'daily' && kind !== 'friend'), mode: opts.mode ?? arenaById(arena).modes[0] })
    prefetchQuestions(arena)
    go('countdown', { arena })
  }, [go, setSession])

  const playNexo = useCallback((arena: ArenaId, mode?: string) => play(arena, nexo.id, 'nexo', { mode }), [play])
  const playSpecialist = useCallback((arena: ArenaId, id?: string, mode?: string) => play(arena, id ?? arenaById(arena).ai, 'specialist', { mode }), [play])
  /** friends are played by NEXO in this demo build */
  const playFriend = useCallback((arena: ArenaId, f: { name: string; mark: string; elo: number }, mode?: string) => {
    const opp: Opponent = { ...nexo, id: `friend-${f.name.toLowerCase()}`, name: f.name.toUpperCase(), mark: f.mark, role: 'Friend', elo: f.elo, skill: 0.5, line: 'Good luck.' }
    setSession({ arena, opponent: opp, kind: 'friend', ranked: false, mode: mode ?? arenaById(arena).modes[0] })
    prefetchQuestions(arena)
    go('countdown', { arena })
  }, [go, setSession])
  /** a real person from a live room; both devices use the same seed so the rounds match */
  const playLive = useCallback((arena: ArenaId, rival: { name: string; mark: string; elo: number }, mode: string, seed: number, items?: Round[]) => {
    const opp: Opponent = { ...nexo, id: `live-${rival.name.toLowerCase()}`, name: rival.name.toUpperCase(), mark: rival.mark, role: 'Live player', elo: rival.elo, skill: 0.5, line: 'Good luck.' }
    setSession({ arena, opponent: opp, kind: 'friend', ranked: false, mode, live: { seed, items } })
    go('countdown', { arena })
  }, [go, setSession])
  return { findMatch, play, playFriend, playLive, playNexo, playSpecialist, opponentById }
}
