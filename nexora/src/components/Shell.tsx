import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Go, Screen } from '../types'
import { useProfile } from '../game/store'
import { levelInfo, rankInfo } from '../game/progression'
import { Logo } from './Logo'
import { Btn } from './Btn'
import { Icon, type IconName } from './Icon'
import { Avatar } from './Avatar'
import { RankBadge } from './RankBadge'
import { XPBar } from './XPBar'
import { useNotifs } from '../game/notif'
import { sfx } from '../motion/sound'

type Item = { screen: Screen; icon: IconName; label: string }

const primary: Item[] = [
  { screen: 'hub', icon: 'home', label: 'Game hub' },
  { screen: 'arenas', icon: 'swords', label: 'Arenas' },
  { screen: 'create-room', icon: 'plus', label: 'Play with friends' },
  { screen: 'friends', icon: 'users', label: 'Social' },
  { screen: 'leaderboard', icon: 'trophy', label: 'Rankings' },
]
const secondary: Item[] = [
  { screen: 'daily', icon: 'clock', label: 'Daily challenge' },
  { screen: 'tournaments', icon: 'crown', label: 'Tournaments' },
  { screen: 'notifications', icon: 'bell', label: 'Notifications' },
  { screen: 'settings', icon: 'sliders', label: 'Settings' },
]

const arenaScreens: Screen[] = ['coding', 'debate', 'roast', 'business', 'knowledge', 'mind', 'opponent', 'matchmaking', 'ai-gallery', 'ai-detail', 'nova', 'result']
const socialScreens: Screen[] = ['friends', 'friend-profile']
const roomScreens: Screen[] = ['create-room', 'join-room', 'lobby']
const rankScreens: Screen[] = ['leaderboard', 'achievements', 'history', 'match-details']

function activeKey(screen: Screen): Screen | null {
  if (arenaScreens.includes(screen)) return 'arenas'
  if (socialScreens.includes(screen)) return 'friends'
  if (roomScreens.includes(screen)) return 'create-room'
  if (rankScreens.includes(screen)) return 'leaderboard'
  if (screen === 'bracket') return 'tournaments'
  return screen
}

export function Shell({ screen, go, children, bleed = false }: { screen: Screen; go: Go; children: ReactNode; bleed?: boolean }) {
  const profile = useProfile()
  const rank = rankInfo(profile.elo)
  const lv = levelInfo(profile.xp)
  const active = activeKey(screen)
  const [menu, setMenu] = useState(false)
  const unread = useNotifs().filter((n) => n.unread).length
  const navRef = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const hoverPill = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const place = () => {
      const nav = navRef.current
      if (!nav || !pill.current) return
      const el = nav.querySelector<HTMLElement>(`[data-nav="${active}"]`)
      if (!el) { pill.current.style.opacity = '0'; return }
      pill.current.style.opacity = '1'
      pill.current.style.height = `${el.offsetHeight}px`
      pill.current.style.transform = `translateY(${el.offsetTop}px)`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [active])

  useEffect(() => { setMenu(false) }, [screen])

  const hoverAt = (el: HTMLElement | null) => {
    const hp = hoverPill.current
    if (!hp) return
    if (!el) { hp.style.opacity = '0'; return }
    hp.style.opacity = '1'
    hp.style.height = `${el.offsetHeight}px`
    hp.style.transform = `translateY(${el.offsetTop}px)`
  }

  const item = (it: Item) => (
    <button
      key={it.screen} data-nav={it.screen} className={`side-item ${active === it.screen ? 'is-active' : ''}`}
      aria-current={active === it.screen ? 'page' : undefined}
      onClick={() => go(it.screen)} onPointerEnter={(e) => { hoverAt(e.currentTarget); sfx('hover') }}
    >
      <span className="side-ico"><Icon name={it.icon} size={20} />{it.screen === 'notifications' && unread > 0 && <i className="badge-dot" />}</span>
      <span>{it.label}</span>
    </button>
  )

  return (
    <div className="shell">
      <aside className="side">
        <Logo go={go} />
        <Btn variant="peach" magnetic icon="play" onClick={() => go('arenas')} className="side-play">Play now</Btn>
        <div className="side-nav" ref={navRef} onPointerLeave={() => hoverAt(null)}>
          <span className="side-hover" ref={hoverPill} aria-hidden="true" />
          <span className="side-pill" ref={pill} aria-hidden="true" />
          {primary.map(item)}
          <hr />
          {secondary.map(item)}
        </div>
        <button className="side-me" onClick={() => go('profile')} aria-label="Open your profile">
          <Avatar name={profile.name} size={44} />
          <span><b>{profile.name}</b><small>{rank.label} · Lv {lv.level}</small></span>
        </button>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="m-brand"><Logo go={go} /></div>
          <span className="top-online"><i className="live-dot" />24,842 playing now</span>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => go('notifications')} aria-label={`Notifications, ${unread} new`}>
              <Icon name="bell" size={20} />
              {unread > 0 && <i className="badge-dot bounce" />}
            </button>
            <button className="top-xp" onClick={() => go('achievements')} aria-label={`Level ${lv.level}, ${Math.round(lv.progress * 100)} percent to next level`}>
              <span>Lv {lv.level}</span>
              <XPBar value={lv.progress} label="Level progress" height={8} />
            </button>
            <button className="top-rank" onClick={() => go('profile')}>
              <RankBadge elo={profile.elo} size={28} />
              <span><b>{rank.label}</b><small className="count">{profile.elo.toLocaleString()} ELO</small></span>
            </button>
            <button className="icon-btn m-menu-btn" onClick={() => setMenu((m) => !m)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}>
              <Icon name={menu ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </header>
        <main id="main" className={`app-main ${bleed ? 'is-bleed' : ''}`} tabIndex={-1}>{children}</main>
      </div>

      <nav className="tabbar" aria-label="Main">
        {[
          { s: 'hub' as Screen, i: 'home' as IconName, l: 'Hub' },
          { s: 'arenas' as Screen, i: 'swords' as IconName, l: 'Arenas' },
        ].map((t) => (
          <button key={t.s} className={active === t.s ? 'is-active' : ''} onClick={() => go(t.s)} aria-current={active === t.s ? 'page' : undefined}><Icon name={t.i} size={22} /><span>{t.l}</span></button>
        ))}
        <button className="tab-play" onClick={() => go('arenas')} aria-label="Play now"><Icon name="play" size={26} /></button>
        <button className={active === 'leaderboard' ? 'is-active' : ''} onClick={() => go('leaderboard')}><Icon name="trophy" size={22} /><span>Rankings</span></button>
        <button className={screen === 'profile' ? 'is-active' : ''} onClick={() => go('profile')}><Icon name="user" size={22} /><span>Profile</span></button>
      </nav>

      <div className={`m-sheet ${menu ? 'is-open' : ''}`} aria-hidden={!menu}>
        <div className="m-sheet-bg" onClick={() => setMenu(false)} />
        <div className="m-sheet-panel">
          {[...primary.slice(2), ...secondary].map((it, i) => (
            <button key={it.screen} style={{ ['--i' as string]: i }} onClick={() => go(it.screen)} tabIndex={menu ? 0 : -1}>
              <Icon name={it.icon} size={22} />{it.label}
              {it.screen === 'notifications' && unread > 0 && <b className="count-pill">{unread}</b>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
