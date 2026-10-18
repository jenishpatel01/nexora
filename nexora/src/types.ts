export type ArenaId = 'coding' | 'debate' | 'roast' | 'business' | 'knowledge' | 'mind'

export type Screen =
  | 'landing' | 'intro' | 'login' | 'register' | 'verify' | 'forgot' | 'email-sent' | 'reset' | 'reset-success' | 'onboarding' | 'hub' | 'arenas'
  | ArenaId
  | 'ai-gallery' | 'ai-detail' | 'nova' | 'profile' | 'friends' | 'friend-profile'
  | 'opponent' | 'matchmaking' | 'create-room' | 'join-room' | 'lobby' | 'countdown' | 'match'
  | 'result' | 'leaderboard' | 'daily' | 'achievements' | 'history' | 'match-details'
  | 'tournaments' | 'bracket' | 'notifications' | 'settings'

export type Go = (screen: Screen, opts?: GoOptions) => void

export type GoOptions = {
  arena?: ArenaId
  opponent?: string
  /** replace history entry instead of pushing */
  replace?: boolean
}

export type Mood = 'idle' | 'happy' | 'sad' | 'think' | 'search' | 'wink' | 'cheer' | 'smug'

export type Opponent = {
  id: string
  name: string
  mark: string
  role: string
  arena: ArenaId | 'all'
  elo: number
  /** 0..1 chance-like strength used by the match simulation */
  skill: number
  style: string
  strength: string
  weakness: string
  winRate: number
  matches: string
  line: string
  isAI: true
}

export type Arena = {
  id: ArenaId
  number: string
  name: string
  tagline: string
  blurb: string
  ai: string
  rating: number
  live: string
  loading: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
  difficultyLevel: 1 | 2 | 3 | 4
  modes: string[]
  challenge: string
  roundNames: string[]
}
