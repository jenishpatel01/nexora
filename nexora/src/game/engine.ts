import type { ArenaId } from '../types'
import { arenaById, opponentById } from '../data/nexo'
import type { Opponent } from '../types'
import { businessBank, codingBank, debateBank, knowledgeBank, logicBank, patternBank, roastBank } from './content'
import { achievementDefs } from './achievements'
import { eloDelta, levelInfo, rankInfo } from './progression'
import { setProfile, type Profile } from './store'
import type { MatchOutcome, PickRound, QuizRound, Round, RoundLog, RoundResult } from './types'

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

function shuffleQuiz(r: QuizRound): QuizRound {
  const idx = shuffle(r.options.map((_, i) => i))
  return { ...r, options: idx.map((i) => r.options[i]), answer: idx.indexOf(r.answer) }
}
function shufflePick(r: PickRound): PickRound { return { ...r, options: shuffle(r.options) } }

export const ROUNDS = 5

/** small deterministic generator so both players in a live room get the same rounds */
function mulberry(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** rounds for a match. With a seed the result is identical on every device. */
export function buildRounds(arena: ArenaId, seed?: number, ai?: Round[] | null): Round[] {
  if (seed === undefined) return makeRounds(arena, ai ?? [])
  const original = Math.random
  Math.random = mulberry(seed)
  try { return makeRounds(arena, ai ?? []) } finally { Math.random = original }
}

/** AI-written rounds of one kind first, topped up from the built-in bank when the AI gave fewer than needed */
const fill = <T extends Round>(ai: Round[], kind: T['kind'], bank: readonly T[], keepOrder = false): T[] => {
  const fresh = ai.filter((r): r is T => r.kind === kind)
  return [...(keepOrder ? fresh : shuffle(fresh)), ...shuffle(bank)].slice(0, ROUNDS)
}

function makeRounds(arena: ArenaId, ai: Round[]): Round[] {
  const names = arenaById(arena).roundNames
  const stage = <T extends Round>(r: T, i: number): T => ({ ...r, stage: r.stage || names[i] })
  switch (arena) {
    case 'coding': return fill(ai, 'quiz', codingBank).map((r, i) => stage(shuffleQuiz(r), i))
    case 'debate': return fill(ai, 'pick', debateBank).map((r, i) => stage(shufflePick({ ...r, stage: undefined }), i))
    case 'roast': return fill(ai, 'pick', roastBank).map((r, i) => stage(shufflePick({ ...r, stage: undefined }), i))
    case 'business': return fill(ai, 'pick', businessBank, true).map((r) => shufflePick(r))
    case 'knowledge': {
      const cats = shuffle(['Science', 'History', 'Sports', 'General'])
      const chosen = cats.map((c) => shuffle(knowledgeBank.filter((q) => q.category === c))[0])
      const extra = shuffle(knowledgeBank.filter((q) => !chosen.includes(q)))[0]
      const fresh = ai.filter((r): r is QuizRound => r.kind === 'quiz')
      return shuffle([...fresh, ...chosen, extra]).slice(0, ROUNDS).map((r, i) => stage(shuffleQuiz(r), i))
    }
    case 'mind': {
      const seq = (len: number): Round => {
        const steps: number[] = []
        while (steps.length < len) { const n = randInt(0, 8); if (n !== steps[steps.length - 1]) steps.push(n) }
        return { kind: 'sequence', length: len, time: 20, steps }
      }
      const mindQuiz = (type: string, bank: QuizRound[]): QuizRound => {
        const hit = shuffle(ai.filter((r): r is QuizRound => r.kind === 'quiz' && r.category === type))[0]
        return shuffleQuiz(hit ? { ...hit, category: 'Mind' } : shuffle(bank)[0])
      }
      const plan: Round[] = [
        mindQuiz('pattern', patternBank),
        seq(4),
        { kind: 'reaction', time: 8, delay: randInt(1400, 3200) },
        mindQuiz('logic', logicBank),
        seq(5),
      ]
      return plan.map((r, i) => stage(r, i))
    }
  }
}

export function comboMultiplier(arena: ArenaId, streak: number) {
  return arena === 'knowledge' ? 1 + 0.5 * Math.min(streak, 4) : 1
}

export function reactionPoints(ms: number, falseStart?: boolean) {
  if (falseStart) return 0
  if (ms < 200) return 150
  if (ms < 250) return 130
  if (ms < 300) return 110
  if (ms < 400) return 80
  if (ms < 500) return 55
  if (ms < 700) return 30
  return 10
}

export function scoreRound(round: Round, res: Omit<RoundResult, 'points'>, combo = 1): number {
  switch (round.kind) {
    case 'quiz': {
      if (!res.correct) return 0
      const speed = Math.round(clamp(1 - res.ms / (round.time * 1000), 0, 1) * 40)
      return Math.round((100 + speed) * combo)
    }
    case 'pick': {
      if (res.choice === undefined) return 0
      const v = round.options[res.choice].value
      const speed = v >= 6 ? Math.round(clamp(1 - res.ms / (round.time * 1000), 0, 1) * 10) : 0
      return v * 10 + speed
    }
    case 'sequence': {
      const count = res.count ?? 0
      const base = Math.round((100 * count) / round.length)
      const bonus = count === round.length ? 30 + Math.round(clamp(1 - res.ms / (round.time * 1000), 0, 1) * 20) : 0
      return base + bonus
    }
    case 'reaction': return reactionPoints(res.ms, res.falseStart)
  }
}

export function aiPlay(round: Round, skill: number, comboStreak = 0, arena: ArenaId = 'knowledge'): RoundResult {
  const combo = comboMultiplier(arena, comboStreak)
  let base: Omit<RoundResult, 'points'>
  switch (round.kind) {
    case 'quiz': {
      const p = clamp(0.35 + skill * 0.6, 0.4, 0.95)
      const correct = Math.random() < p
      const ms = Math.min(round.time * 1000 - 400, (3500 + Math.random() * 5500) * (1.2 - skill * 0.6))
      const wrong = shuffle(round.options.map((_, i) => i).filter((i) => i !== round.answer))[0]
      base = { choice: correct ? round.answer : wrong, correct, ms }
      break
    }
    case 'pick': {
      const w = round.options.map((o) => Math.exp(o.value * (0.18 + skill * 0.35)))
      const total = w.reduce((a, b) => a + b, 0)
      let r = Math.random() * total
      let choice = 0
      for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) { choice = i; break } }
      base = { choice, ms: 4000 + Math.random() * 8000 }
      break
    }
    case 'sequence': {
      const ok = Math.random() < 0.35 + skill * 0.6
      base = { count: ok ? round.length : randInt(1, round.length - 1), ms: 6000 + Math.random() * 4000 }
      break
    }
    case 'reaction': {
      const falseStart = Math.random() < 0.05
      base = { ms: Math.round(520 - skill * 230 + Math.random() * 140), falseStart }
      break
    }
  }
  return { ...base, points: scoreRound(round, base, combo) }
}

export function finishMatch(
  profile: Profile,
  ctx: { arena: ArenaId; opponent: Opponent; ranked: boolean; logs: RoundLog[]; durationSec: number },
): MatchOutcome {
  const { arena, opponent, ranked, logs, durationSec } = ctx
  const playerScore = logs.reduce((s, l) => s + l.player.points, 0)
  const rivalScore = logs.reduce((s, l) => s + l.rival.points, 0)
  const result: MatchOutcome['result'] = playerScore > rivalScore ? 'win' : playerScore < rivalScore ? 'loss' : 'draw'
  const sc = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
  const opponentElo = opponent.id === 'nexo' ? profile.elo + 14 : opponent.elo
  const eloD = ranked ? eloDelta(profile.elo, opponentElo, sc) : 0
  const arenaD = ranked ? eloDelta(profile.arena[arena].elo, opponentElo, sc) : 0
  const eloAfter = Math.max(100, profile.elo + eloD)
  const arenaAfter = Math.max(100, profile.arena[arena].elo + arenaD)

  const base = result === 'win' ? 120 + Math.round(playerScore / 5) : result === 'draw' ? 90 : 60 + Math.round(playerScore / 10)
  const xpGain = ranked ? base : Math.round(base / 2)
  const streak = result === 'win' ? profile.streak + 1 : result === 'loss' ? 0 : profile.streak
  const flawless = logs.every((l) => l.player.points >= l.rival.points && l.player.points > 0)
  const reactionLogs = logs.filter((l) => l.round.kind === 'reaction' && !l.player.falseStart)
  const bestReactionMs = reactionLogs.length ? Math.min(...reactionLogs.map((l) => l.player.ms)) : null

  const beaten = result === 'win' && opponent.id !== 'nexo' && !profile.beaten.includes(opponent.id) ? [...profile.beaten, opponent.id] : profile.beaten
  const rec = {
    id: `NX-${20000 + profile.wins + profile.losses + profile.draws + 1}`,
    at: Date.now(),
    arena, opponent: opponent.name, result, playerScore, rivalScore, eloDelta: eloD, xp: xpGain, durationSec, ranked,
  }

  let next: Profile = {
    ...profile,
    elo: eloAfter,
    xp: profile.xp + xpGain,
    streak,
    bestStreak: Math.max(profile.bestStreak, streak),
    wins: profile.wins + (result === 'win' ? 1 : 0),
    losses: profile.losses + (result === 'loss' ? 1 : 0),
    draws: profile.draws + (result === 'draw' ? 1 : 0),
    arena: { ...profile.arena, [arena]: { elo: arenaAfter, played: profile.arena[arena].played + 1, wins: profile.arena[arena].wins + (result === 'win' ? 1 : 0) } },
    history: [rec, ...profile.history].slice(0, 40),
    trail: [...profile.trail, eloAfter].slice(-14),
    beaten,
    nexoWins: profile.nexoWins + (result === 'win' && opponent.id === 'nexo' ? 1 : 0),
  }

  const outcome: MatchOutcome = {
    arena, opponentId: opponent.id, opponentName: opponent.name, opponentElo, ranked, result,
    playerScore, rivalScore, rounds: logs.map((l) => ({ p: l.player.points, r: l.rival.points })),
    eloBefore: profile.elo, eloAfter, eloDelta: eloAfter - profile.elo,
    arenaEloBefore: profile.arena[arena].elo, arenaEloAfter: arenaAfter,
    xpGain, xpBefore: profile.xp, xpAfter: next.xp,
    levelBefore: levelInfo(profile.xp).level, levelAfter: levelInfo(next.xp).level,
    rankBefore: rankInfo(profile.elo).label, rankAfter: rankInfo(eloAfter).label,
    rankUp: rankInfo(eloAfter).tier > rankInfo(profile.elo).tier,
    bandUp: rankInfo(eloAfter).bandIndex > rankInfo(profile.elo).bandIndex,
    streak, flawless, bestReactionMs, unlocked: [], durationSec, id: rec.id, at: rec.at,
  }

  // achievements
  const unlocked: string[] = []
  const achievements = { ...next.achievements }
  for (const def of achievementDefs) {
    if (achievements[def.id]) continue
    if (def.earned(next, outcome)) { achievements[def.id] = Date.now(); unlocked.push(def.id) }
  }
  const bonusXp = unlocked.reduce((s, id) => s + (achievementDefs.find((a) => a.id === id)?.xp ?? 0), 0)
  next = { ...next, achievements, xp: next.xp + bonusXp }
  outcome.unlocked = unlocked
  outcome.xpGain += bonusXp
  outcome.xpAfter = next.xp
  outcome.levelAfter = levelInfo(next.xp).level
  rec.xp = outcome.xpGain
  setProfile(next)
  return outcome
}

export { opponentById }
