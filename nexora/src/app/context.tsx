import { createContext, useContext } from 'react'
import type { Arena, ArenaId, Go, Opponent, Screen } from '../types'
import type { MatchOutcome, RoundLog } from '../game/types'

export type SessionKind = 'nexo' | 'online' | 'specialist' | 'friend' | 'practice' | 'daily'

export type MatchSession = {
  arena: ArenaId
  opponent: Opponent
  kind: SessionKind
  ranked: boolean
  mode: string
  /** set for a live room match: both players build the same rounds from this seed */
  live?: { seed: number }
}

export type AppApi = {
  screen: Screen
  go: Go
  arena: Arena
  session: MatchSession
  /** pick the opponent for the next match */
  setSession: (patch: Partial<MatchSession> & { opponentId?: string }) => void
  outcome: MatchOutcome | null
  setOutcome: (o: MatchOutcome | null) => void
  logs: RoundLog[]
  setLogs: (l: RoundLog[]) => void
  aiId: string
  setAiId: (id: string) => void
}

export const AppCtx = createContext<AppApi | null>(null)

export function useApp(): AppApi {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside <AppCtx.Provider>')
  return ctx
}
