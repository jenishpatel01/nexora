import { useState } from 'react'
import { useApp } from '../app/context'
import { arenas, rankBands } from '../data/nexo'
import { achievementDefs } from '../game/achievements'
import { useProfile } from '../game/store'
import { levelInfo, rankInfo } from '../game/progression'
import { Avatar } from '../components/Avatar'
import { Btn } from '../components/Btn'
import { Icon } from '../components/Icon'
import { RankBadge } from '../components/RankBadge'
import { XPBar } from '../components/XPBar'
import { Nexo } from '../components/Nexo'
import { useToasts } from '../components/Toasts'
import { removeFriend, setInviteTarget, useLive } from '../net/live'
import { CountUp } from '../motion/CountUp'
import { Reveal } from '../motion/Reveal'
import { useInView } from '../motion/hooks'

function Trend({ values, color = 'var(--lav)' }: { values: number[]; color?: string }) {
  const [ref, seen] = useInView<SVGSVGElement>()
  const w = 600, h = 200, pad = 14
  const min = Math.min(...values) - 20, max = Math.max(...values) + 20
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (w - pad * 2), h - pad - ((v - min) / (max - min)) * (h - pad * 2)])
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ')
  const area = `${d} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h} Z`
  return (
    <svg ref={ref} className={`trend ${seen ? 'is-in' : ''}`} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Rating over the last ${values.length} matches, from ${values[0]} to ${values[values.length - 1]}`} preserveAspectRatio="none">
      <defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path className="trend-area" d={area} fill="url(#trend-fill)" />
      <path className="trend-line" d={d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" vectorEffect="non-scaling-stroke" />
      {pts.map((q, i) => <circle key={i} className="trend-dot" cx={q[0]} cy={q[1]} r={i === pts.length - 1 ? 6 : 3.5} fill={i === pts.length - 1 ? 'var(--peach)' : color} style={{ ['--i' as string]: i }} />)}
    </svg>
  )
}

export function Profile() {
  const { go } = useApp()
  const p = useProfile()
  const rank = rankInfo(p.elo)
  const lv = levelInfo(p.xp)
  const total = p.wins + p.losses + p.draws
  const wr = total ? Math.round((p.wins / total) * 100) : 0
  const earned = achievementDefs.filter((a) => p.achievements[a.id])
  const best = [...arenas].sort((a, b) => p.arena[b.id].elo - p.arena[a.id].elo)[0]
  const maxElo = Math.max(...arenas.map((a) => p.arena[a.id].elo))

  return (
    <div className="page profile stagger">
      <section className="pf-head panel dark">
        <Avatar name={p.name} size={110} />
        <div className="pf-id">
          <h1 className="t-xl">{p.name}</h1>
          <p className="muted">{rank.label} · Level {lv.level} · Best arena: {best.name}</p>
          <div className="pf-xp"><XPBar value={lv.progress} label="Level progress" height={12} /><small className="muted">{lv.into} / {lv.need} XP to level {lv.level + 1}</small></div>
        </div>
        <div className="pf-rank"><RankBadge elo={p.elo} size={92} /><b className="display"><CountUp to={p.elo} /></b><small className="muted">{rank.toNext > 0 ? `${rank.toNext} to ${rank.nextLabel}` : 'Top rank'}</small></div>
      </section>

      <section className="pf-stats">
        {[{ l: 'Matches', v: total }, { l: 'Wins', v: p.wins }, { l: 'Win rate', v: wr, s: '%' }, { l: 'Best streak', v: p.bestStreak }].map((s) => (
          <Reveal key={s.l} variant="scale" className="stat-big"><b className="display"><CountUp to={s.v} suffix={s.s} onView /></b><span>{s.l}</span></Reveal>
        ))}
      </section>

      <section className="pf-grid">
        <Reveal className="panel pf-chart">
          <div className="sec-head slim"><h2 className="t-m">Rating trend</h2><span className="chip lav">Last {p.trail.length} matches</span></div>
          <Trend values={p.trail} color="#7656e0" />
        </Reveal>

        <Reveal className="panel dark pf-arenas" delay={100}>
          <h2 className="t-m">Arena ratings</h2>
          <ul>
            {arenas.map((a) => {
              const s = p.arena[a.id]
              return (
                <li key={a.id} style={{ ['--accent' as string]: `var(--${a.id})` }}>
                  <button onClick={() => go(a.id)}>
                    <span className="pa-n">{a.name}</span>
                    <span className="pa-bar"><i style={{ width: `${(s.elo / maxElo) * 100}%` }} /></span>
                    <b className="display count">{s.elo}</b>
                  </button>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </section>

      <Reveal as="section" className="pf-ach">
        <div className="sec-head"><h2 className="t-l">Achievements <span className="muted">{earned.length}/{achievementDefs.length}</span></h2><button className="link-btn" onClick={() => go('achievements')}>See all</button></div>
        <div className="ach-strip">
          {earned.slice(0, 8).map((a) => <div key={a.id} className="ach-chip"><span className="ach-ico"><Icon name="trophy" size={20} /></span>{a.name}</div>)}
          {earned.length === 0 && <p className="muted">Win a match to unlock your first one.</p>}
        </div>
      </Reveal>

      <Reveal as="section" className="pf-ranks panel dark">
        <h2 className="t-m">Rank ladder</h2>
        <ol>
          {rankBands.map((b) => (
            <li key={b.name} className={b.name === rank.band ? 'is-now' : p.elo >= b.from ? 'is-done' : ''}><RankBadge elo={b.from + 5} size={30} /><span>{b.name}</span></li>
          ))}
        </ol>
      </Reveal>
    </div>
  )
}

export function FriendProfile() {
  const { go, aiId } = useApp()
  const { notify } = useToasts()
  const live = useLive()
  const f = live.friends.find((x) => x.uid === aiId)
  const [confirm, setConfirm] = useState(false)
  if (!f) {
    return (
      <div className="page empty">
        <Nexo mood="think" size={140} speech="Who is that?" />
        <h1 className="t-l">Friend not found</h1>
        <p className="muted">They may have been removed, or the server is reconnecting.</p>
        <Btn variant="peach" onClick={() => go('friends')}>Back to Social</Btn>
      </div>
    )
  }
  const rk = rankInfo(f.elo)
  const challenge = () => { setInviteTarget(f); go('create-room') }
  const remove = async () => {
    if (!confirm) { setConfirm(true); window.setTimeout(() => setConfirm(false), 3000); return }
    try { await removeFriend(f.uid); notify(`${f.username} removed`); go('friends') } catch (e) { notify(e instanceof Error ? e.message : 'Could not remove.') }
  }
  return (
    <div className="page profile stagger">
      <button className="back-link" onClick={() => go('friends')}><Icon name="back" size={18} />Social</button>
      <section className="pf-head panel dark">
        <Avatar name={f.username} mark={f.mark} size={110} online={f.online} />
        <div className="pf-id"><h1 className="t-xl">{f.username}</h1><p className="muted">{rk.label} · {f.online ? 'Online now' : 'Offline'} · {f.uid}</p></div>
        <div className="pf-rank"><RankBadge elo={f.elo} size={92} /><b className="display">{f.elo}</b></div>
      </section>
      <div className="hub-cta">
        <Btn size="lg" variant="peach" icon="swords" disabled={!f.online} onClick={challenge}>{f.online ? `Challenge ${f.username}` : `${f.username} is offline`}</Btn>
        <Btn size="lg" variant="ghost" onClick={remove}>{confirm ? 'Click again to remove' : 'Remove friend'}</Btn>
      </div>
    </div>
  )
}
