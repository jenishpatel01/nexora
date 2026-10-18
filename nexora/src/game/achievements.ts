import type { Profile } from './store'
import type { MatchOutcome } from './types'
import { specialists } from '../data/nexo'
import { rankInfo } from './progression'

export type AchievementDef = {
  id: string
  name: string
  note: string
  xp: number
  target?: number
  /** current value for countable achievements */
  value?: (p: Profile) => number
  earned: (p: Profile, o: MatchOutcome | null) => boolean
}

const arenaWin = (arena: string) => (_p: Profile, o: MatchOutcome | null) => !!o && o.arena === arena && o.result === 'win'

export const achievementDefs: AchievementDef[] = [
  { id: 'first-battle', name: 'First battle', note: 'Finish your first match', xp: 50, earned: (p) => p.wins + p.losses + p.draws > 0 },
  { id: 'code-master', name: 'Code master', note: 'Win a Coding match', xp: 120, earned: arenaWin('coding') },
  { id: 'debate-champion', name: 'Debate champion', note: 'Win a Debate match', xp: 120, earned: arenaWin('debate') },
  { id: 'roast-king', name: 'Roast king', note: 'Win a Roast match', xp: 120, earned: arenaWin('roast') },
  { id: 'ceo-mindset', name: 'CEO mindset', note: 'Win a Business match', xp: 120, earned: arenaWin('business') },
  { id: 'knowledge-beast', name: 'Knowledge beast', note: 'Win a Knowledge match', xp: 120, earned: arenaWin('knowledge') },
  { id: 'mind-bender', name: 'Mind bender', note: 'Win a Mind games match', xp: 120, earned: arenaWin('mind') },
  { id: 'flawless', name: 'Flawless', note: 'Win every round of a match', xp: 200, earned: (_p, o) => !!o && o.flawless && o.result === 'win' },
  { id: 'hot-hands', name: 'Hot hands', note: 'Win 3 matches in a row', xp: 100, target: 3, value: (p) => p.streak, earned: (p) => p.streak >= 3 },
  { id: 'unstoppable', name: 'Unstoppable', note: 'Win 10 matches in a row', xp: 300, target: 10, value: (p) => p.streak, earned: (p) => p.streak >= 10 },
  { id: 'ai-hunter', name: 'AI hunter', note: 'Beat 3 different AI rivals', xp: 150, target: 3, value: (p) => p.beaten.length, earned: (p) => p.beaten.length >= 3 },
  { id: 'ai-slayer', name: 'AI slayer', note: 'Beat all six arena specialists', xp: 400, target: 6, value: (p) => specialists.filter((s) => p.beaten.includes(s.id)).length, earned: (p) => specialists.every((s) => p.beaten.includes(s.id)) },
  { id: 'nexo-nemesis', name: 'NEXO nemesis', note: 'Beat NEXO 5 times', xp: 150, target: 5, value: (p) => p.nexoWins, earned: (p) => p.nexoWins >= 5 },
  { id: 'comeback-kid', name: 'Comeback kid', note: 'Win after trailing by 100+ points', xp: 150, earned: (_p, o) => {
    if (!o || o.result !== 'win') return false
    let d = 0
    let min = 0
    for (const r of o.rounds) { d += r.p - r.r; min = Math.min(min, d) }
    return min <= -100
  } },
  { id: 'quick-draw', name: 'Quick draw', note: 'React in under 250 ms', xp: 120, earned: (_p, o) => !!o && o.bestReactionMs !== null && o.bestReactionMs < 250 },
  { id: 'platinum-bound', name: 'Platinum bound', note: 'Reach Platinum rank', xp: 250, earned: (p) => rankInfo(p.elo).bandIndex >= 3 },
]

export const achievementById = (id: string) => achievementDefs.find((a) => a.id === id)!
