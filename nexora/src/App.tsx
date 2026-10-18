import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ArenaId, Go, GoOptions, Screen } from './types'
import { arenaById, nexo, opponentById } from './data/nexo'
import { ALL_SCREENS, BARE_SCREENS, TITLES, isArenaScreen, screenFromHash } from './app/screens'
import { AppCtx, type AppApi, type MatchSession } from './app/context'
import type { MatchOutcome, RoundLog } from './game/types'
import { Shell } from './components/Shell'
import { ContextLoader } from './components/Loader'
import { ToastProvider } from './components/Toasts'
import { CursorFollower } from './motion/CursorFollower'
import { motionReduced } from './motion/hooks'
import { sfx } from './motion/sound'
import { setBooted } from './app/boot'
import { LiveLayer } from './components/LiveLayer'
import { restoreAccount } from './net/account'
import './net/live'

const lz = <T extends Record<string, unknown>, K extends keyof T>(load: () => Promise<T>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType })))

const Landing = lz(() => import('./screens/Landing'), 'Landing')
const ProductIntro = lz(() => import('./screens/Landing'), 'ProductIntro')
const Auth = lz(() => import('./screens/Auth'), 'Auth')
const AccountFlow = lz(() => import('./screens/Auth'), 'AccountFlow')
const Onboarding = lz(() => import('./screens/Auth'), 'Onboarding')
const Hub = lz(() => import('./screens/Hub'), 'Hub')
const ArenaSelect = lz(() => import('./screens/Arenas'), 'ArenaSelect')
const ArenaPage = lz(() => import('./screens/Arenas'), 'ArenaPage')
const AIGallery = lz(() => import('./screens/Arenas'), 'AIGallery')
const AIDetail = lz(() => import('./screens/Arenas'), 'AIDetail')
const NexoPage = lz(() => import('./screens/Arenas'), 'NexoPage')
const OpponentSelect = lz(() => import('./screens/Arenas'), 'OpponentSelect')
const Matchmaking = lz(() => import('./screens/MatchFlow'), 'Matchmaking')
const MatchIntro = lz(() => import('./screens/MatchFlow'), 'MatchIntro')
const CreateRoom = lz(() => import('./screens/Rooms'), 'CreateRoom')
const JoinRoom = lz(() => import('./screens/Rooms'), 'JoinRoom')
const Lobby = lz(() => import('./screens/Rooms'), 'Lobby')
const ActiveMatch = lz(() => import('./screens/Match'), 'ActiveMatch')
const Result = lz(() => import('./screens/Result'), 'Result')
const Leaderboard = lz(() => import('./screens/Rankings'), 'Leaderboard')
const Profile = lz(() => import('./screens/Profile'), 'Profile')
const FriendProfile = lz(() => import('./screens/Profile'), 'FriendProfile')
const Friends = lz(() => import('./screens/Social'), 'Friends')
const Daily = lz(() => import('./screens/Features'), 'Daily')
const Achievements = lz(() => import('./screens/Features'), 'Achievements')
const History = lz(() => import('./screens/Features'), 'History')
const MatchDetails = lz(() => import('./screens/Features'), 'MatchDetails')
const Tournaments = lz(() => import('./screens/Features'), 'Tournaments')
const Bracket = lz(() => import('./screens/Features'), 'Bracket')
const Notifications = lz(() => import('./screens/Features'), 'Notifications')
const Settings = lz(() => import('./screens/Features'), 'Settings')

const SWAP_MS = 400
const WIPE_MS = 820

function renderScreen(screen: Screen): ReactNode {
  switch (screen) {
    case 'landing': return <Landing />
    case 'intro': return <ProductIntro />
    case 'login': case 'register': return <Auth />
    case 'verify': case 'forgot': case 'email-sent': case 'reset': case 'reset-success': return <AccountFlow />
    case 'onboarding': return <Onboarding />
    case 'countdown': return <MatchIntro />
    case 'match': return <ActiveMatch />
    case 'hub': return <Hub />
    case 'arenas': return <ArenaSelect />
    case 'coding': case 'debate': case 'roast': case 'business': case 'knowledge': case 'mind': return <ArenaPage />
    case 'ai-gallery': return <AIGallery />
    case 'ai-detail': return <AIDetail />
    case 'nova': return <NexoPage />
    case 'opponent': return <OpponentSelect />
    case 'matchmaking': return <Matchmaking />
    case 'create-room': return <CreateRoom />
    case 'join-room': return <JoinRoom />
    case 'lobby': return <Lobby />
    case 'result': return <Result />
    case 'leaderboard': return <Leaderboard />
    case 'profile': return <Profile />
    case 'friend-profile': return <FriendProfile />
    case 'friends': return <Friends />
    case 'daily': return <Daily />
    case 'achievements': return <Achievements />
    case 'history': return <History />
    case 'match-details': return <MatchDetails />
    case 'tournaments': return <Tournaments />
    case 'bracket': return <Bracket />
    case 'notifications': return <Notifications />
    case 'settings': return <Settings />
  }
}

void restoreAccount()

export default function App() {
  const [screen, setScreen] = useState<Screen>(screenFromHash)
  const [booting, setBooting] = useState(true)
  const [wipe, setWipe] = useState<{ on: boolean; label: string; key: number }>({ on: false, label: '', key: 0 })
  const [arenaId, setArenaId] = useState<ArenaId>(() => { const s0 = screenFromHash(); return isArenaScreen(s0) ? s0 : 'mind' })
  const [aiId, setAiId] = useState('zero')
  const [session, setSessionState] = useState<MatchSession>(() => { const s0 = screenFromHash(); const a0: ArenaId = isArenaScreen(s0) ? s0 : 'mind'; return { arena: a0, opponent: nexo, kind: 'nexo', ranked: true, mode: arenaById(a0).modes[0] } })
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null)
  const [logs, setLogs] = useState<RoundLog[]>([])
  const timers = useRef<number[]>([])
  const current = useRef(screen)

  useEffect(() => { const t = window.setTimeout(() => { setBooting(false); setBooted() }, motionReduced() ? 350 : 1150); return () => window.clearTimeout(t) }, [])

  useEffect(() => {
    current.current = screen
    document.title = `${TITLES[screen] ?? 'NEXORA'} | NEXORA`
  }, [screen])

  const swap = useCallback((next: Screen, replace?: boolean) => {
    setScreen(next)
    const url = `#/${next}`
    if (window.location.hash !== url) {
      if (replace) window.history.replaceState(null, '', url)
      else window.history.pushState(null, '', url)
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    window.setTimeout(() => document.getElementById('screen')?.focus({ preventScroll: true }), 30)
  }, [])

  const navigate = useCallback((next: Screen, replace?: boolean) => {
    if (next === current.current) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    if (motionReduced()) { swap(next, replace); return }
    const label = isArenaScreen(next) ? arenaById(next).name : next === 'countdown' ? 'Get ready' : ''
    setWipe((w) => ({ on: true, label, key: w.key + 1 }))
    timers.current.push(window.setTimeout(() => swap(next, replace), SWAP_MS))
    timers.current.push(window.setTimeout(() => setWipe((w) => ({ ...w, on: false })), WIPE_MS))
    sfx(next === 'countdown' ? 'match-start' : 'click')
  }, [swap])

  const go: Go = useCallback((next: Screen, opts: GoOptions = {}) => {
    if (opts.arena) { setArenaId(opts.arena); setSessionState((s) => ({ ...s, arena: opts.arena! })) }
    else if (isArenaScreen(next)) { setArenaId(next); setSessionState((s) => ({ ...s, arena: next })) }
    if (opts.opponent) setAiId(opts.opponent)
    navigate(next, opts.replace)
  }, [navigate])

  useEffect(() => {
    const onPop = () => {
      const next = screenFromHash()
      if (!ALL_SCREENS.includes(next)) return
      if (isArenaScreen(next)) { setArenaId(next); setSessionState((s) => ({ ...s, arena: next, mode: arenaById(next).modes[0] })) }
      timers.current.forEach((t) => window.clearTimeout(t))
      setScreen(next)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onPop)
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('hashchange', onPop) }
  }, [])

  const setSession = useCallback((patch: Partial<MatchSession> & { opponentId?: string }) => {
    setSessionState((s) => {
      const { opponentId, ...rest } = patch
      return { ...s, live: undefined, ...rest, ...(opponentId ? { opponent: opponentById(opponentId) } : {}) }
    })
  }, [])

  const arena = arenaById(arenaId)
  const api = useMemo<AppApi>(() => ({ screen, go, arena, session, setSession, outcome, setOutcome, logs, setLogs, aiId, setAiId }), [screen, go, arena, session, setSession, outcome, logs, aiId])

  const bare = BARE_SCREENS.includes(screen)
  const bleed = isArenaScreen(screen)
  const page = renderScreen(screen)

  return (
    <AppCtx.Provider value={api}>
      <ToastProvider>
        <a className="skip-link" href="#screen">Skip to content</a>
        <div id="screen" tabIndex={-1} className="screen" data-screen={screen}>
          <Suspense fallback={<ContextLoader message="Initializing arena..." />}>
            {bare ? page : <Shell screen={screen} go={go} bleed={bleed}>{page}</Shell>}
          </Suspense>
        </div>
        {wipe.on && (
          <div className="wipe" key={wipe.key} aria-hidden="true">
            <i /><i /><i /><i />
            {wipe.label && <span>{wipe.label}</span>}
          </div>
        )}
        {booting && <ContextLoader message="Initializing arena..." />}
        <CursorFollower />
        <LiveLayer />
      </ToastProvider>
    </AppCtx.Provider>
  )
}
