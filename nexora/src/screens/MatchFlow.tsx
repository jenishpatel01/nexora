import { useEffect, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { useStart } from '../app/flow'
import { nexo } from '../data/nexo'
import { useProfile } from '../game/store'
import { rankInfo } from '../game/progression'
import { Btn } from '../components/Btn'
import { Nexo } from '../components/Nexo'
import { ArenaScene } from '../components/ArenaScene'
import { Avatar } from '../components/Avatar'
import { RankBadge } from '../components/RankBadge'
import { motionReduced } from '../motion/hooks'
import { sfx } from '../motion/sound'

type Phase = 'search' | 'none' | 'found'

export function Matchmaking() {
  const { go, arena, session } = useApp()
  const { play } = useStart()
  const p = useProfile()
  const [phase, setPhase] = useState<Phase>('search')
  const [secs, setSecs] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    const fast = motionReduced()
    const t: number[] = []
    t.push(window.setTimeout(() => setPhase('none'), fast ? 1200 : 4200))
    t.push(window.setTimeout(() => { setPhase('found'); sfx('match-start') }, fast ? 2200 : 6000))
    t.push(window.setTimeout(() => { if (!done.current) { done.current = true; play(arena.id, 'nexo', 'online', { ranked: true, mode: session.mode }) } }, fast ? 3200 : 8200))
    return () => t.forEach(window.clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (phase !== 'search') return
    const i = window.setInterval(() => setSecs((s) => s + 1), 1000)
    return () => window.clearInterval(i)
  }, [phase])

  const skip = () => { if (done.current) return; done.current = true; play(arena.id, 'nexo', 'online', { ranked: true, mode: session.mode }) }
  const rank = rankInfo(p.elo)
  const mood = phase === 'search' ? 'search' : phase === 'none' ? 'wink' : 'cheer'

  return (
    <div className={`mm ap-${arena.id}`} style={{ ['--accent' as string]: `var(--${arena.id})` }}>
      <div className="ap-backdrop" aria-hidden="true"><ArenaScene id={arena.id} /><span className="ap-shade strong" /></div>
      <div className="mm-inner">
        <p className="chip"><i className="live-dot" />{arena.name} · {session.mode} · Ranked</p>
        <div className="mm-stage">
          <div className="mm-radar" aria-hidden="true"><i /><i /><i /></div>
          <div className="mm-you"><Avatar name={p.name} size={84} /><b className="display">{p.name}</b><span className="mm-rank"><RankBadge elo={p.elo} size={20} />{rank.label}</span></div>
          <div className={`mm-vs ${phase !== 'search' ? 'is-hit' : ''}`}>VS</div>
          <div className="mm-them">
            {phase === 'search' ? <div className="mm-unknown" aria-hidden="true">?</div> : <Nexo mood={mood} size={110} interactive={false} track={false} />}
            <b className="display">{phase === 'search' ? 'Searching' : 'NEXO'}</b>
            <span className="mm-rank">{phase === 'search' ? `Rating ±75 of ${p.elo}` : `AI · ${nexo.elo} ELO`}</span>
          </div>
        </div>
        <div className="mm-status" aria-live="polite">
          {phase === 'search' && <><h1 className="t-l">SEARCHING FOR OPPONENT...</h1><p className="muted">{secs}s elapsed</p></>}
          {phase === 'none' && <><h1 className="t-l">Nobody showed up.</h1><p className="lead mm-nexo-line">I&rsquo;ll play.</p></>}
          {phase === 'found' && <><h1 className="t-l mm-found">MATCH FOUND</h1><p className="muted">Opponent: NEXO (AI)</p></>}
        </div>
        <div className="mm-actions">
          <Btn variant="ghost" icon="close" cue="click" onClick={() => go(arena.id)}>Cancel</Btn>
          {phase === 'search' && <Btn variant="cream" onClick={skip}>Play NEXO now</Btn>}
        </div>
      </div>
    </div>
  )
}

const beats = ['READY', '3', '2', '1', 'GO!'] as const

export function MatchIntro() {
  const { go, arena, session } = useApp()
  const p = useProfile()
  const [i, setI] = useState(-1)
  const opp = session.opponent
  const leaving = useRef(false)

  useEffect(() => {
    const fast = motionReduced()
    const step = fast ? 380 : 820
    const t: number[] = []
    t.push(window.setTimeout(() => setI(0), fast ? 300 : 1500))
    beats.forEach((_, k) => {
      if (k === 0) return
      t.push(window.setTimeout(() => { setI(k); sfx(k === 4 ? 'go' : 'tick') }, (fast ? 300 : 1500) + step * k))
    })
    t.push(window.setTimeout(() => { if (!leaving.current) { leaving.current = true; go('match', { replace: true }) } }, (fast ? 300 : 1500) + step * 4 + (fast ? 300 : 650)))
    sfx('match-start')
    return () => t.forEach(window.clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const skip = () => { if (leaving.current) return; leaving.current = true; go('match', { replace: true }) }
  const beat = i >= 0 ? beats[i] : null

  return (
    <div className={`mi ap-${arena.id}`} style={{ ['--accent' as string]: `var(--${arena.id})` }} onClick={skip}>
      <div className="ap-backdrop" aria-hidden="true"><ArenaScene id={arena.id} /><span className="ap-shade strong" /></div>
      <div className="mi-inner">
        <p className="chip mi-arena">{arena.name} · {session.mode}{session.ranked ? ' · Ranked' : ' · Unranked'}</p>
        <div className="mi-versus">
          <div className="mi-side mi-l"><Avatar name={p.name} size={110} /><b className="display">{p.name}</b><span>{rankInfo(p.elo).label} · {p.elo}</span></div>
          <div className="mi-vs">VS</div>
          <div className="mi-side mi-r">
            {opp.id === 'nexo' ? <Nexo mood="smug" size={130} interactive={false} track={false} /> : <Avatar name={opp.name} mark={opp.mark} size={110} />}
            <b className="display">{opp.name}</b><span>{opp.id === 'nexo' ? 'AI companion' : opp.role} · {opp.id === 'nexo' ? p.elo + 14 : opp.elo}</span>
          </div>
        </div>
        <div className="mi-beat" aria-live="assertive" role="status">
          {beat && <span key={beat} className={`beat beat-${beat === 'GO!' ? 'go' : beat === 'READY' ? 'ready' : 'num'}`}>{beat}</span>}
        </div>
        <p className="mi-hint small muted">Tap anywhere to skip</p>
      </div>
    </div>
  )
}
