import type { ArenaId } from '../types'

export type PickOption = {
  id: string
  text: string
  /** 0 to 10, how strong this choice is */
  value: number
  tag?: string
  note?: string
  share?: number
  trust?: number
}

export type QuizRound = {
  kind: 'quiz'
  stage?: string
  category?: string
  prompt: string
  code?: string
  options: string[]
  answer: number
  why: string
  time: number
}

export type PickRound = {
  kind: 'pick'
  stage?: string
  context: string
  quote?: string
  prompt: string
  options: PickOption[]
  time: number
}

export type SequenceRound = { kind: 'sequence'; stage?: string; length: number; time: number; steps: number[] }
export type ReactionRound = { kind: 'reaction'; stage?: string; time: number; delay: number }

export type Round = QuizRound | PickRound | SequenceRound | ReactionRound

export type RoundResult = {
  choice?: number
  correct?: boolean
  ms: number
  /** sequence: how many steps were right, reaction: false start */
  count?: number
  falseStart?: boolean
  timedOut?: boolean
  points: number
}

export type RoundLog = { round: Round; player: RoundResult; rival: RoundResult }

export type MatchOutcome = {
  arena: ArenaId
  opponentId: string
  opponentName: string
  opponentElo: number
  ranked: boolean
  result: 'win' | 'loss' | 'draw'
  playerScore: number
  rivalScore: number
  rounds: { p: number; r: number }[]
  eloBefore: number
  eloAfter: number
  eloDelta: number
  arenaEloBefore: number
  arenaEloAfter: number
  xpGain: number
  xpBefore: number
  xpAfter: number
  levelBefore: number
  levelAfter: number
  rankBefore: string
  rankAfter: string
  rankUp: boolean
  bandUp: boolean
  streak: number
  flawless: boolean
  bestReactionMs: number | null
  unlocked: string[]
  durationSec: number
  id: string
  at: number
}
