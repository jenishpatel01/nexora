import { useEffect, useState } from 'react'
import { useApp } from '../app/context'
import { useStart } from '../app/flow'
import { arenaById } from '../data/nexo'
import { achievementById } from '../game/achievements'
import { levelInfo, rankInfo } from '../game/progression'
import { Btn } from '../components/Btn'
import { Nexo } from '../components/Nexo'
import { RankBadge } from '../components/RankBadge'
import { XPBar } from '../components/XPBar'
import { Icon } from '../components/Icon'
import { useToasts } from '../components/Toasts'
import { CountUp } from '../motion/CountUp'
import { sfx } from '../motion/sound'
import { motionReduced } from '../motion/hooks'

const confetti = Array.from({ length: 44 }, (_, i) => i)
const colors = ['var(--lav)', 'var(--peach)', 'var(--mint)', 'var(--pink)', 'var(--blue)', 'var(--gold)']

export function Result() {
  const { go, outcome, session, logs } = useApp()
  const { play } = useStart()
  const toasts = useToasts()
  const [copied, setCopied] = useState(false)
  const [rankShown, setRankShown] = useState(false)

  useEffect(() => {
    if (!outcome) return
    const timers: number[] = []
    sfx(outcome.result === 'win' ? 'victory' : outcome.result === 'loss' ? 'defeat' : 'confirm')
    const base = motionReduced() ? 200 : 2400
    outcome.unlocked.forEach((id, i) => timers.push(window.setTimeout(() => toasts.achievement(id), base + i * 900)))
    if (outcome.rankUp) timers.push(window.setTimeout(() => { setRankShown(true); sfx('rankup') }, motionReduced() ? 400 : 1900))
    return () => timers.forEach(window.clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome?.id])

  if (!outcome) {
    return (
      <div className="page empty">
        <Nexo mood="think" size={160} speech="No match to show yet." />
        <h1 className="t-l">Play a match to see your result.</h1>
        <Btn variant="peach" icon="play" onClick={() => go('arenas')}>Choose an arena</Btn>
      </div>
    )
  }

  const o = outcome
  const arena = arenaById(o.arena)
  const win = o.result === 'win'
  const draw = o.result === 'draw'
  const rankBefore = rankInfo(o.eloBefore)
  const rank = rankInfo(o.eloAfter)
  const lvBefore = levelInfo(o.xpBefore)
  const lv = levelInfo(o.xpAfter)
  const title = win ? 'VICTORY' : draw ? 'DRAW' : 'DEFEAT'
  const line = win ? (o.flawless ? 'Flawless. NEXO is taking notes.' : `You beat ${o.opponentName}.`) : draw ? 'Dead even. Run it back?' : `${o.opponentName} took this one.`
  const maxRound = Math.max(...o.rounds.flatMap((r) => [r.p, r.r]), 1)

  const copy = async () => {
    const text = `${win ? 'Won' : draw ? 'Drew' : 'Lost'} ${o.playerScore}-${o.rivalScore} against ${o.opponentName} in NEXORA ${arena.name}. ${o.eloDelta >= 0 ? '+' : ''}${o.eloDelta} ELO.`
    try { await navigator.clipboard.writeText(text) } catch { /* clipboard unavailable */ }
    setCopied(true)
    sfx('confirm')
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={`page result res-page-${o.result}`} style={{ ['--accent' as string]: `var(--${arena.id})` }}>
      {win && !motionReduced() && (
        <div className="confetti" aria-hidden="true">
          {confetti.map((i) => <i key={i} style={{ ['--a' as string]: `${i * 8.2 + (i % 3) * 5}deg`, ['--d' as string]: `${220 + (i % 5) * 70}px`, ['--c' as string]: colors[i % colors.length], ['--r' as string]: `${(i * 47) % 360}deg`, animationDelay: `${(i % 7) * 40}ms` }} />)}
        </div>
      )}

      <section className="rs-hero">
        <Nexo mood={win ? 'cheer' : draw ? 'wink' : 'sad'} size={190} speech={win ? 'Okay. That was good.' : draw ? 'Rematch?' : 'Gotcha. Mostly luck.'} />
        <div className="rs-title">
          <p className="kicker">{arena.name} · {o.ranked ? 'Ranked' : 'Unranked'} · vs {o.opponentName}</p>
          <h1 className="t-hero rs-word" aria-label={title}>{title.split('').map((c, i) => <span key={i} style={{ ['--i' as string]: i }}>{c}</span>)}</h1>
          <p className="lead">{line}</p>
        </div>
        <div className="rs-score">
          <div><small>You</small><b className="display"><CountUp to={o.playerScore} duration={1200} delay={500} /></b></div>
          <i>:</i>
          <div><small>{o.opponentName}</small><b className="display"><CountUp to={o.rivalScore} duration={1200} delay={500} /></b></div>
        </div>
      </section>

      <section className="rs-grid">
        <div className="panel dark rs-card rs-elo">
          <div className="rs-card-head"><h2 className="t-m">{o.ranked ? 'Rating' : 'Unranked'}</h2>{o.ranked && <span className={`chip ${o.eloDelta >= 0 ? 'mint' : 'pink'}`}>{o.eloDelta >= 0 ? '+' : ''}{o.eloDelta} ELO</span>}</div>
          <div className="rs-rank">
            <RankBadge elo={o.eloAfter} size={78} />
            <div><b className="display rs-big"><CountUp to={o.eloAfter} from={o.eloBefore} duration={1500} delay={900} /></b><span className="muted">{rank.label}</span></div>
          </div>
          <XPBar value={rank.bandIndex === rankBefore.bandIndex && rank.division === rankBefore.division ? rank.progress : rank.progress} from={rankBefore.progress} color="lavender" label="Rank progress" height={12} delay={900} />
          <small className="muted">{rank.toNext > 0 ? `${rank.toNext} ELO to ${rank.nextLabel}` : 'Top rank reached'}</small>
        </div>

        <div className="panel dark rs-card">
          <div className="rs-card-head"><h2 className="t-m">Experience</h2><span className="chip peach">+{o.xpGain} XP</span></div>
          <div className="rs-lv"><b className="display rs-big">Lv {lv.level}</b>{o.levelAfter > o.levelBefore && <span className="chip gold lvl-up"><Icon name="star" size={14} />Level up!</span>}</div>
          <XPBar value={o.levelAfter > o.levelBefore ? lv.progress : lv.progress} from={o.levelAfter > o.levelBefore ? 0 : lvBefore.progress} label="Level progress" height={12} delay={1200} />
          <small className="muted">{lv.into} / {lv.need} XP to level {lv.level + 1}</small>
        </div>

        <div className="panel dark rs-card rs-rounds">
          <div className="rs-card-head"><h2 className="t-m">Rounds</h2><span className="muted small">{o.streak > 1 ? `${o.streak}-win streak` : 'Round by round'}</span></div>
          <ul>
            {o.rounds.map((r, i) => (
              <li key={i}>
                <span className="rr-n">{arena.roundNames[i] ?? `Round ${i + 1}`}</span>
                <span className="rr-bars">
                  <i className="me" style={{ width: `${(r.p / maxRound) * 100}%`, animationDelay: `${i * 120 + 300}ms` }} />
                  <i className="them" style={{ width: `${(r.r / maxRound) * 100}%`, animationDelay: `${i * 120 + 380}ms` }} />
                </span>
                <b className={r.p > r.r ? 'up' : r.p < r.r ? 'down' : ''}>{r.p}<small> / {r.r}</small></b>
              </li>
            ))}
          </ul>
        </div>

        {o.unlocked.length > 0 && (
          <div className="panel dark rs-card rs-ach">
            <div className="rs-card-head"><h2 className="t-m">Unlocked</h2></div>
            <ul>{o.unlocked.map((id) => { const a = achievementById(id); return <li key={id}><span className="ach-ico"><Icon name="trophy" size={22} /></span><span><b className="display">{a.name}</b><small>{a.note}</small></span><em>+{a.xp} XP</em></li> })}</ul>
          </div>
        )}
      </section>

      <div className="rs-actions">
        <Btn size="lg" variant="peach" magnetic icon="refresh" onClick={() => (session.live ? go('lobby') : play(o.arena, o.opponentId, session.kind === 'online' ? 'nexo' : session.kind, { ranked: o.ranked, mode: session.mode }))}>{session.live ? 'Back to room' : 'Rematch'}</Btn>
        <Btn size="lg" variant="primary" onClick={() => go(o.arena)}>Back to {arena.name}</Btn>
        <Btn variant="ghost" icon={copied ? 'check' : 'copy'} cue="click" onClick={copy}>{copied ? 'Copied' : 'Copy result'}</Btn>
        <button className="link-btn" onClick={() => go('hub')}>Game hub</button>
      </div>
      <span className="sr-only" role="status">{logs.length} rounds played. {title}.</span>

      {rankShown && (
        <div className="rankup" role="dialog" aria-modal="true" aria-label="Rank up" onClick={() => setRankShown(false)}>
          <div className="rankup-card">
            <small>{o.bandUp ? 'New rank' : 'Promotion'}</small>
            <h2 className="t-xl">RANK UP</h2>
            <div className="ru-badges"><span className="ru-from"><RankBadge elo={o.eloBefore} size={70} /></span><Icon name="arrow" size={32} /><span className="ru-to"><RankBadge elo={o.eloAfter} size={110} /></span></div>
            <p className="t-m"><span className="muted">{o.rankBefore}</span> to <b>{o.rankAfter}</b></p>
            <Btn variant="peach" onClick={() => setRankShown(false)}>Keep climbing</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
