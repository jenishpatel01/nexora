import type { ArenaId, Screen } from '../types'

export const ALL_SCREENS: Screen[] = [
  'landing', 'intro', 'login', 'register', 'verify', 'forgot', 'email-sent', 'reset', 'reset-success', 'onboarding', 'hub', 'arenas',
  'coding', 'debate', 'roast', 'business', 'knowledge', 'mind',
  'ai-gallery', 'ai-detail', 'nova', 'profile', 'friends', 'friend-profile',
  'opponent', 'matchmaking', 'create-room', 'join-room', 'lobby', 'countdown', 'match',
  'result', 'leaderboard', 'daily', 'achievements', 'history', 'match-details',
  'tournaments', 'bracket', 'notifications', 'settings',
]

export const ARENA_IDS: ArenaId[] = ['coding', 'debate', 'roast', 'business', 'knowledge', 'mind']
export const isArenaScreen = (s: Screen): s is ArenaId => (ARENA_IDS as string[]).includes(s)

/** screens rendered full-bleed without the app shell */
export const BARE_SCREENS: Screen[] = ['landing', 'intro', 'login', 'register', 'verify', 'forgot', 'email-sent', 'reset', 'reset-success', 'onboarding', 'countdown', 'match']

export const TITLES: Partial<Record<Screen, string>> = {
  landing: 'Think faster. Outsmart everyone.', hub: 'Game hub', arenas: 'Arenas', leaderboard: 'Rankings', profile: 'Profile', friends: 'Social',
  login: 'Sign in', register: 'Create account', settings: 'Settings', daily: 'Daily challenge', achievements: 'Achievements', history: 'Match history',
  tournaments: 'Tournaments', notifications: 'Notifications', result: 'Match result', match: 'In match', countdown: 'Match starting',
  coding: 'Coding arena', debate: 'Debate arena', roast: 'Roast arena', business: 'Business arena', knowledge: 'Knowledge arena', mind: 'Mind games arena',
}

export function screenFromHash(): Screen {
  const h = window.location.hash.replace(/^#\/?/, '') as Screen
  return ALL_SCREENS.includes(h) ? h : 'landing'
}
