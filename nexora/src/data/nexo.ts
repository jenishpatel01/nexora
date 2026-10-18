import type { Arena, ArenaId, Opponent } from '../types'

export const arenas: Arena[] = [
  {
    id: 'coding', number: '01', name: 'Coding', tagline: 'Build. Break. Optimize.', ai: 'zero', rating: 1284, live: '8.4K',
    blurb: 'Spot the bug, name the complexity, beat the clock.',
    loading: 'Compiling match...', difficulty: 'Hard', difficultyLevel: 3,
    modes: ['Quick fix', 'Debug', 'Algorithm', 'Code battle'],
    challenge: 'Repair the function before the test suite expires.',
    roundNames: ['Warm-up', 'Bug hunt', 'Complexity', 'Edge case', 'Final build'],
  },
  {
    id: 'debate', number: '02', name: 'Debate', tagline: 'Control the argument.', ai: 'vex', rating: 1196, live: '6.1K',
    blurb: 'Pick the reply a judge would reward. Evidence beats volume.',
    loading: 'Preparing the stage...', difficulty: 'Expert', difficultyLevel: 4,
    modes: ['Opening', 'Argument', 'Counter', 'Final'],
    challenge: 'Defend the motion: cities should prioritize public space over cars.',
    roundNames: ['Opening', 'Argument', 'Counter', 'Rebuttal', 'Closing'],
  },
  {
    id: 'roast', number: '03', name: 'Roast', tagline: 'Timing is everything.', ai: 'roastai', rating: 1241, live: '4.7K',
    blurb: 'Land the sharpest friendly comeback. The crowd decides.',
    loading: 'Mic check...', difficulty: 'Medium', difficultyLevel: 2,
    modes: ['One liner', 'Comeback', 'Crowd work', 'Mic drop'],
    challenge: 'Land the sharpest safe comeback. The crowd decides.',
    roundNames: ['Opener', 'Comeback', 'Crowd work', 'Heat check', 'Mic drop'],
  },
  {
    id: 'business', number: '04', name: 'Business', tagline: 'Read the market.', ai: 'atlas', rating: 1327, live: '5.2K',
    blurb: 'Make five calls. Grow your share without losing trust.',
    loading: 'Opening the market...', difficulty: 'Hard', difficultyLevel: 3,
    modes: ['Startup', 'Expansion', 'Crisis', 'Takeover'],
    challenge: 'Grow market share without losing customer trust.',
    roundNames: ['Launch', 'Growth', 'Crisis', 'Takeover', 'Exit'],
  },
  {
    id: 'knowledge', number: '05', name: 'Knowledge', tagline: 'Know more. Move first.', ai: 'sage', rating: 1372, live: '12.8K',
    blurb: 'Five questions. Chain correct answers to multiply your score.',
    loading: 'Loading questions...', difficulty: 'Medium', difficultyLevel: 2,
    modes: ['Science', 'History', 'Sports', 'General'],
    challenge: 'Five categories. Ten questions. One champion.',
    roundNames: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
  },
  {
    id: 'mind', number: '06', name: 'Mind games', tagline: 'See what others miss.', ai: 'orion', rating: 1218, live: '9.3K',
    blurb: 'Patterns, memory and reflexes under pressure.',
    loading: 'Calibrating your mind...', difficulty: 'Medium', difficultyLevel: 2,
    modes: ['Memory', 'Pattern', 'Reaction', 'Logic'],
    challenge: 'Identify the missing sequence under pressure.',
    roundNames: ['Pattern', 'Memory', 'Reaction', 'Logic', 'Memory+'],
  },
]

export const arenaById = (id: ArenaId): Arena => arenas.find((a) => a.id === id)!

export const nexo: Opponent = {
  id: 'nexo', name: 'NEXO', mark: 'N', role: 'Your adaptive companion', arena: 'all', elo: 1262, skill: 0.55,
  style: 'Adapts to how you play', strength: 'Adapting mid-match', weakness: 'Gets cocky when ahead', winRate: 52, matches: '1.2M',
  line: 'You ready for another round?', isAI: true,
}

export const specialists: Opponent[] = [
  { id: 'zero', name: 'ZERO', mark: '0', role: 'Technical specialist', arena: 'coding', elo: 1768, skill: 0.68, style: 'Minimal, exact, relentless', strength: 'Precision', weakness: 'Ambiguity', winRate: 73, matches: '16,204', line: 'Precision without panic.', isAI: true },
  { id: 'vex', name: 'VEX', mark: 'V', role: 'Aggressive debater', arena: 'debate', elo: 1724, skill: 0.66, style: 'Provocative, fast, ruthless', strength: 'Counterargument', weakness: 'Nuance', winRate: 71, matches: '21,084', line: 'Convince me. I dare you.', isAI: true },
  { id: 'roastai', name: 'ROAST AI', mark: 'R', role: 'Comedy battle specialist', arena: 'roast', elo: 1692, skill: 0.62, style: 'Quick, playful, cheeky', strength: 'Timing', weakness: 'Repeats favorite bits', winRate: 66, matches: '9,812', line: 'Bring your best. I brought snacks.', isAI: true },
  { id: 'atlas', name: 'ATLAS', mark: 'A', role: 'Market strategist', arena: 'business', elo: 1810, skill: 0.72, style: 'Patient, tactical, severe', strength: 'Prediction', weakness: 'Chaos', winRate: 76, matches: '12,650', line: 'Every market has a pattern.', isAI: true },
  { id: 'sage', name: 'SAGE', mark: 'S', role: 'Knowledge specialist', arena: 'knowledge', elo: 1498, skill: 0.5, style: 'Measured, broad, patient', strength: 'Recall', weakness: 'Speed', winRate: 61, matches: '24,771', line: 'I read the whole encyclopedia. Twice.', isAI: true },
  { id: 'orion', name: 'ORION', mark: 'O', role: 'Pattern hunter', arena: 'mind', elo: 1664, skill: 0.64, style: 'Calm, analytical, precise', strength: 'Pattern recognition', weakness: 'Time pressure', winRate: 68, matches: '18,492', line: 'Everything repeats. Eventually.', isAI: true },
]

export const allOpponents: Opponent[] = [nexo, ...specialists]
export const opponentById = (id: string): Opponent => allOpponents.find((o) => o.id === id) ?? nexo

export const rankBands: { name: string; from: number; to: number; color: string }[] = [
  { name: 'Bronze', from: 0, to: 999, color: '#E2A47C' },
  { name: 'Silver', from: 1000, to: 1199, color: '#C9D3E6' },
  { name: 'Gold', from: 1200, to: 1399, color: '#F5C86A' },
  { name: 'Platinum', from: 1400, to: 1599, color: '#8ED8FF' },
  { name: 'Diamond', from: 1600, to: 1799, color: '#A78BFA' },
  { name: 'Master', from: 1800, to: 1999, color: '#FF9FCB' },
  { name: 'Grandmaster', from: 2000, to: 2199, color: '#FFB38A' },
  { name: 'Nexora Elite', from: 2200, to: 99999, color: '#F5C86A' },
]

export type LeaderEntry = {
  id: string
  name: string
  base: number
  win: number
  streak: number
  move: number
  country: string
  friend?: boolean
  you?: boolean
  arena: Record<ArenaId, number>
}

const mk = (name: string, base: number, win: number, streak: number, move: number, country: string, friend = false): LeaderEntry => {
  // deterministic per-arena ratings so filters reorder the board
  let seed = 0
  for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const ids: ArenaId[] = ['coding', 'debate', 'roast', 'business', 'knowledge', 'mind']
  const arena = {} as Record<ArenaId, number>
  ids.forEach((id) => { arena[id] = Math.round(base + (rnd() - 0.5) * 360) })
  return { id: name, name, base, win, streak, move, country, friend, arena }
}

export const leaderSeed: LeaderEntry[] = [
  mk('MIRA X', 2284, 82, 14, 3, 'SE'),
  mk('KAIROS', 2217, 79, 9, 0, 'JP'),
  mk('ANIKA R.', 2104, 75, 11, 1, 'IN'),
  mk('VOIDWALKER', 2056, 77, 7, -1, 'DE'),
  mk('PAX-7', 1960, 72, 8, 2, 'US'),
  mk('RATIONALIST', 1824, 70, 5, -2, 'GB'),
  mk('LUNA-K', 1790, 68, 4, 4, 'BR'),
  mk('DRIFT', 1655, 65, 6, 0, 'CA'),
  mk('ECHO.9', 1544, 63, 3, 1, 'FR'),
  mk('ARLO', 1412, 61, 2, 5, 'AU', true),
  mk('MIKA', 1304, 62, 2, 2, 'IN', true),
  mk('SAKI', 1278, 57, 3, -1, 'JP', true),
  mk('NOAH', 1184, 54, 1, 0, 'NZ', true),
]

export const notificationsSeed = [
  { id: 'n1', kind: 'invite', title: 'Mika invited you', note: 'Mind game, private room NX-48291', age: '2m', unread: true },
  { id: 'n2', kind: 'rank', title: 'Rank updated', note: 'You reached Gold III', age: '1h', unread: true },
  { id: 'n3', kind: 'nexo', title: 'NEXO has a drill for you', note: 'Reaction training, 6 minutes', age: '3h', unread: true },
  { id: 'n4', kind: 'event', title: 'Open Circuit qualifiers', note: 'Season 04 starts in 48 hours', age: '1d', unread: false },
]

export const friendsSeed = [
  { id: 'mika', mark: 'MI', name: 'Mika', arena: 'Mind', elo: 1304, online: true },
  { id: 'arlo', mark: 'AR', name: 'Arlo', arena: 'Debate', elo: 1412, online: true },
  { id: 'saki', mark: 'SK', name: 'Saki', arena: 'Coding', elo: 1278, online: false },
  { id: 'noah', mark: 'NO', name: 'Noah', arena: 'Business', elo: 1184, online: false },
]

export const requestsSeed = [
  { id: 'req1', mark: 'LK', name: 'Luna-K', note: 'Wants to be rivals' },
  { id: 'req2', mark: 'DR', name: 'Drift', note: 'Challenged you to Roast' },
]
