import { useEffect, useState } from 'react'
import { useApp } from '../app/context'
import { useStart } from '../app/flow'
import { arenas, allOpponents, specialists, nexo, arenaById, opponentById } from '../data/nexo'
import type { Arena, ArenaId, Mood, Opponent } from '../types'
import { useProfile } from '../game/store'
import { rankInfo } from '../game/progression'
import { Btn } from '../components/Btn'
import { Nexo } from '../components/Nexo'
import { WorldCard, Pips } from '../components/WorldCard'
import { ArenaScene } from '../components/ArenaScene'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { Segmented } from '../components/Segmented'
import { ContextLoader } from '../components/Loader'
import { CountUp } from '../motion/CountUp'
import { motionReduced } from '../motion/hooks'

export function ArenaSelect() {
  const { go } = useApp()
  const p = useProfile()
  return (
    <div className="page stagger">
      <div className="page-head">
        <div><h1 className="t-xl">Arenas</h1><p className="lead">Six worlds, each with its own rules, rival and rating.</p></div>
      </div>
      <div className="world-grid">
        {arenas.map((a) => <WorldCard key={a.id} arena={a} rating={p.arena[a.id].elo} onOpen={() => go(a.id)} />)}
      </div>
    </div>
  )
}

export function ArenaPage() {
  const { go, arena } = useApp()
  const { findMatch, playNexo, playSpecialist, play } = useStart()
  const p = useProfile()
  const [mode, setMode] = useState(arena.modes[0])
  const [loading, setLoading] = useState(!motionReduced())
  const ai = opponentById(arena.ai)
  const st = p.arena[arena.id]
  const wr = st.played ? Math.round((st.wins / st.played) * 100) : 0

  useEffect(() => { setMode(arena.modes[0]); if (motionReduced()) return; setLoading(true); const t = window.setTimeout(() => setLoading(false), 750); return () => window.clearTimeout(t) }, [arena])

  return (
    <div className={`arena-page ap-${arena.id}`} style={{ ['--accent' as string]: `var(--${arena.id})` }}>
      <div className="ap-backdrop" aria-hidden="true"><ArenaScene id={arena.id} /><span className="ap-shade" /></div>
      {loading && <ContextLoader message={arena.loading} arena={arena.id} mood="search" overlay />}
      <div className="ap-inner">
        <button className="back-link" onClick={() => go('arenas')}><Icon name="back" size={18} />All arenas</button>
        <div className="ap-grid">
          <div className="ap-main">
            <p className="kicker" style={{ color: 'var(--accent)' }}><i className="live-dot" />{arena.live} playing now</p>
            <h1 className="t-hero ap-title">{arena.name}</h1>
            <p className="t-m ap-tag">{arena.tagline}</p>
            <p className="lead">{arena.blurb}</p>
            <div className="ap-modes">
              <span className="muted small">Mode</span>
              <Segmented label="Game mode" options={arena.modes.map((m) => ({ value: m, label: m }))} value={mode} onChange={setMode} tone={`var(--${arena.id})`} />
            </div>
            <div className="ap-cta">
              <Btn size="lg" variant="peach" magnetic icon="play" onClick={() => findMatch(arena.id, mode)}>Find opponent</Btn>
              <Btn size="lg" variant="ghost" onClick={() => playNexo(arena.id, mode)}>Play NEXO</Btn>
            </div>
            <p className="ap-fine">Ranked. If nobody shows up, NEXO will play instead.</p>
          </div>

          <aside className="ap-side">
            <div className="panel dark ap-stats">
              <div><small>Your rating</small><b className="display"><CountUp to={st.elo} /></b></div>
              <div><small>Matches</small><b className="display"><CountUp to={st.played} /></b></div>
              <div><small>Win rate</small><b className="display"><CountUp to={wr} suffix="%" /></b></div>
            </div>
            <div className="panel ap-rival">
              <div className="ap-rival-head"><Avatar name={ai.name} mark={ai.mark} size={56} /><div><small>Arena specialist</small><h3 className="t-m">{ai.name}</h3><span className="muted small">{ai.role}</span></div></div>
              <p className="ap-quote">&ldquo;{ai.line}&rdquo;</p>
              <div className="ap-rival-meta"><Pips level={arena.difficultyLevel} label={arena.difficulty} /><span className="chip lav">{ai.elo} ELO</span></div>
              <Btn variant="primary" size="sm" onClick={() => playSpecialist(arena.id, ai.id, mode)}>Challenge {ai.name}</Btn>
            </div>
            <div className="ap-links">
              <button className="chip-btn" onClick={() => go('opponent')}>Pick another rival</button>
              <button className="chip-btn" onClick={() => play(arena.id, 'nexo', 'practice', { ranked: false, mode })}>Practice (unranked)</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function RivalCard({ o, onOpen, cta }: { o: Opponent; onOpen: () => void; cta?: string }) {
  const arena = o.arena === 'all' ? null : arenaById(o.arena)
  return (
    <button className="rival-card" data-cursor="card" onClick={onOpen} style={{ ['--accent' as string]: arena ? `var(--${arena.id})` : 'var(--lav)' }}>
      <span className="rc-top"><Avatar name={o.name} mark={o.mark} size={64} /><span className="chip">{arena ? arena.name : 'All arenas'}</span></span>
      <b className="display rc-name">{o.name}</b>
      <span className="muted rc-role">{o.role}</span>
      <span className="rc-stats"><span><b className="count">{o.elo}</b><small>ELO</small></span><span><b className="count">{o.winRate}%</b><small>Win rate</small></span></span>
      <span className="rc-line">&ldquo;{o.line}&rdquo;</span>
      <span className="rc-cta">{cta ?? 'View profile'}<Icon name="arrow" size={16} /></span>
    </button>
  )
}

export function OpponentSelect() {
  const { go, arena, session } = useApp()
  const { play } = useStart()
  const [pick, setPick] = useState<string>(session.opponent.id)
  const list: Opponent[] = [nexo, ...specialists.filter((s) => s.arena === arena.id), ...specialists.filter((s) => s.arena !== arena.id)]
  const chosen = opponentById(pick)
  return (
    <div className="page stagger">
      <button className="back-link" onClick={() => go(arena.id)}><Icon name="back" size={18} />{arena.name}</button>
      <div className="page-head"><div><h1 className="t-xl">Choose your rival</h1><p className="lead">Playing in the {arena.name} arena. Specialists in other arenas play it a little rusty.</p></div></div>
      <div className="rival-grid" role="radiogroup" aria-label="Opponent">
        {list.map((o) => (
          <button key={o.id} role="radio" aria-checked={pick === o.id} className={`rival-pick ${pick === o.id ? 'is-on' : ''}`} onClick={() => setPick(o.id)}>
            <Avatar name={o.name} mark={o.mark} size={52} />
            <span><b className="display">{o.name}</b><small>{o.role}</small></span>
            <span className="rp-elo count">{o.elo}</span>
            {o.arena === arena.id && <span className="chip mint rp-tag">Specialist</span>}
            <i className="rp-check"><Icon name="check" size={16} /></i>
          </button>
        ))}
      </div>
      <div className="sticky-cta">
        <span><b className="display">{chosen.name}</b><small className="muted"> · {chosen.style}</small></span>
        <Btn variant="peach" icon="play" onClick={() => play(arena.id, chosen.id, chosen.id === 'nexo' ? 'nexo' : 'specialist', { mode: session.mode })}>Start match</Btn>
      </div>
    </div>
  )
}

export function AIGallery() {
  const { go, setAiId } = useApp()
  return (
    <div className="page stagger">
      <div className="page-head"><div><h1 className="t-xl">Meet the AI rivals</h1><p className="lead">NEXO plays everything. Each specialist lives in one arena and does not forgive mistakes.</p></div></div>
      <div className="rival-cards">
        {allOpponents.map((o) => <RivalCard key={o.id} o={o} onOpen={() => { setAiId(o.id); go(o.id === 'nexo' ? 'nova' : 'ai-detail') }} />)}
      </div>
    </div>
  )
}

export function AIDetail() {
  const { go, aiId } = useApp()
  const { playSpecialist } = useStart()
  const o = opponentById(aiId === 'nexo' ? 'zero' : aiId)
  const arena = o.arena === 'all' ? arenas[0] : arenaById(o.arena as ArenaId)
  const p = useProfile()
  return (
    <div className="page stagger ai-detail" style={{ ['--accent' as string]: `var(--${arena.id})` }}>
      <button className="back-link" onClick={() => go('ai-gallery')}><Icon name="back" size={18} />All rivals</button>
      <div className="aid-hero panel dark">
        <Avatar name={o.name} mark={o.mark} size={120} />
        <div>
          <span className="chip">{arena.name} specialist</span>
          <h1 className="t-xl">{o.name}</h1>
          <p className="lead">{o.role}. {o.style}.</p>
        </div>
        <Btn size="lg" variant="peach" icon="play" onClick={() => playSpecialist(arena.id, o.id)}>Challenge {o.name}</Btn>
      </div>
      <div className="aid-grid">
        <div className="panel"><small className="muted">ELO</small><b className="display aid-big">{o.elo}</b><small className="muted">{rankInfo(o.elo).label}</small></div>
        <div className="panel"><small className="muted">Win rate</small><b className="display aid-big">{o.winRate}%</b><small className="muted">{o.matches} matches</small></div>
        <div className="panel"><small className="muted">Strength</small><b className="display aid-mid">{o.strength}</b></div>
        <div className="panel"><small className="muted">Weakness</small><b className="display aid-mid">{o.weakness}</b></div>
      </div>
      <p className="aid-note">{p.beaten.includes(o.id) ? `You have beaten ${o.name} before.` : `You have not beaten ${o.name} yet.`}</p>
    </div>
  )
}

export function NexoPage() {
  const { go } = useApp()
  const { playNexo } = useStart()
  const [mood, setMood] = useState<Mood>('idle')
  const p = useProfile()
  const moods: [Mood, string][] = [['idle', 'Idle'], ['happy', 'Happy'], ['think', 'Thinking'], ['search', 'Searching'], ['smug', 'Smug'], ['sad', 'Defeated'], ['cheer', 'Level up']]
  return (
    <div className="page stagger nexo-page">
      <button className="back-link" onClick={() => go('ai-gallery')}><Icon name="back" size={18} />All rivals</button>
      <div className="np-grid">
        <div className="np-stage"><div className="meet-blob" /><Nexo mood={mood} size={300} speech={mood === 'idle' ? nexo.line : undefined} onPoke={() => setMood('wink')} /></div>
        <div className="np-copy">
          <span className="chip lav"><Icon name="bolt" size={14} />AI companion</span>
          <h1 className="t-xl">NEXO</h1>
          <p className="lead">Your adaptive sparring partner. NEXO plays all six arenas, matches your level, and reacts to every win and loss. It is an AI, and proud of it.</p>
          <div className="mood-row" role="group" aria-label="NEXO moods">
            {moods.map(([m, l]) => <button key={m} className={`chip-btn ${mood === m ? 'is-on' : ''}`} onClick={() => setMood(m)}>{l}</button>)}
          </div>
          <div className="np-stats"><div><b className="display">{p.nexoWins}</b><small>Times you beat NEXO</small></div><div><b className="display">{nexo.elo}</b><small>NEXO ELO</small></div><div><b className="display">{nexo.winRate}%</b><small>Win rate</small></div></div>
          <Btn size="lg" variant="peach" icon="play" magnetic onClick={() => playNexo(p.history[0]?.arena ?? 'mind')}>Play NEXO</Btn>
        </div>
      </div>
    </div>
  )
}

export type { Arena }
