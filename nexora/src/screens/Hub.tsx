import { useApp } from '../app/context'
import { useStart, dailyArena, todayKey } from '../app/flow'
import { arenas, arenaById } from '../data/nexo'
import { useAccount } from '../net/account'
import { setInviteTarget, useLive } from '../net/live'
import { useProfile } from '../game/store'
import { levelInfo, rankInfo } from '../game/progression'
import { Btn } from '../components/Btn'
import { Nexo } from '../components/Nexo'
import { RankBadge } from '../components/RankBadge'
import { XPBar } from '../components/XPBar'
import { WorldCard } from '../components/WorldCard'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { CountUp } from '../motion/CountUp'
import { Reveal } from '../motion/Reveal'

const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Late night session' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }
const ago = (t: number) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago` }

export function Hub() {
  const { go } = useApp()
  const { findMatch, play } = useStart()
  const p = useProfile()
  const { me } = useAccount()
  const liveFriends = useLive().friends
  const rank = rankInfo(p.elo)
  const lv = levelInfo(p.xp)
  const last = p.history[0]
  const lastArena = last ? last.arena : 'mind'
  const daily = dailyArena()
  const dailyDone = p.dailyDone === todayKey()
  const total = p.wins + p.losses + p.draws

  return (
    <div className="page hub stagger">
      <section className="hub-top">
        <div className="hub-hello panel dark">
          <div className="hub-hello-copy">
            <p className="kicker">{greet()}, {p.name}</p>
            <h1 className="t-l">Ready for your next match?</h1>
            <p className="muted">{p.streak > 0 ? `You are on a ${p.streak}-win streak. NEXO would like to change that.` : 'Win one to start a streak.'}</p>
            <div className="hub-cta">
              <Btn variant="peach" size="lg" magnetic icon="play" onClick={() => findMatch(lastArena)}>Quick match</Btn>
              <Btn variant="ghost" onClick={() => go('arenas')}>Choose an arena</Btn>
              <Btn variant="ghost" icon="users" onClick={() => go('create-room')}>Play with a friend</Btn>
              <Btn variant="ghost" onClick={() => go('join-room')}>Join with code</Btn>
            </div>
          </div>
          <Nexo size={190} mood={p.streak >= 3 ? 'smug' : 'idle'} speech={p.streak >= 3 ? 'Hot streak. Do not get cocky.' : 'You ready for another round?'} />
        </div>

        <button className="hub-rank panel" onClick={() => go('profile')} data-cursor="card" aria-label="Open your profile">
          <div className="hr-head">
            <RankBadge elo={p.elo} size={72} />
            <div>
              <small>Current rank</small>
              <b className="display">{rank.label}</b>
              <span className="count"><CountUp to={p.elo} /> ELO</span>
            </div>
          </div>
          <div className="hr-bar">
            <XPBar value={rank.progress} color="lavender" label="Progress to next rank" height={12} />
            <small>{rank.toNext} ELO to {rank.nextLabel}</small>
          </div>
          <div className="hr-bar">
            <XPBar value={lv.progress} label="Level progress" height={12} delay={300} />
            <small>Level {lv.level}: {lv.into} / {lv.need} XP</small>
          </div>
        </button>
      </section>

      <section className="hub-stats" aria-label="Your stats">
        {[
          { l: 'Matches', v: total, i: 'swords' as const },
          { l: 'Win rate', v: total ? Math.round((p.wins / total) * 100) : 0, s: '%', i: 'chart' as const },
          { l: 'Win streak', v: p.streak, i: 'flame' as const },
          { l: 'Best streak', v: p.bestStreak, i: 'star' as const },
        ].map((s) => (
          <div className="stat" key={s.l}><Icon name={s.i} size={22} /><b className="display"><CountUp to={s.v} suffix={s.s} /></b><span>{s.l}</span></div>
        ))}
      </section>

      <section aria-labelledby="hub-arenas">
        <div className="sec-head"><h2 id="hub-arenas" className="t-l">Pick an arena</h2><button className="link-btn" onClick={() => go('arenas')}>See all details</button></div>
        <div className="world-grid">
          {arenas.map((a) => (
            <WorldCard key={a.id} arena={a} rating={p.arena[a.id].elo} onOpen={() => go(a.id)} />
          ))}
        </div>
      </section>

      <section className="hub-row">
        <Reveal className={`panel daily daily-${daily}`}>
          <div className="daily-top"><span className="chip peach"><Icon name="clock" size={14} />Daily challenge</span>{dailyDone && <span className="chip mint"><Icon name="check" size={14} />Done</span>}</div>
          <h3 className="t-m">{arenaById(daily).name}: {arenaById(daily).challenge}</h3>
          <p className="muted small">Unranked. Bonus XP and a streak freeze for the first run of the day.</p>
          <Btn variant="peach" size="sm" disabled={dailyDone} onClick={() => play(daily, arenaById(daily).ai, 'daily', { ranked: false })}>{dailyDone ? 'Come back tomorrow' : 'Start challenge'}</Btn>
        </Reveal>

        <Reveal className="panel dark recent" delay={90}>
          <div className="sec-head slim"><h3 className="t-m">Recent matches</h3><button className="link-btn small" onClick={() => go('history')}>History</button></div>
          <ul>
            {p.history.slice(0, 4).map((m) => (
              <li key={m.id}>
                <span className={`res res-${m.result}`}>{m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D'}</span>
                <span><b>{arenaById(m.arena).name}</b><small>vs {m.opponent} · {ago(m.at)}</small></span>
                <em className={m.eloDelta >= 0 ? 'up' : 'down'}>{m.eloDelta >= 0 ? '+' : ''}{m.eloDelta}</em>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="panel dark online" delay={180}>
          <div className="sec-head slim"><h3 className="t-m">Friends</h3><button className="link-btn small" onClick={() => go('friends')}>Social</button></div>
          {!me
            ? <p className="muted small">Create an account to get a player ID and add friends.</p>
            : liveFriends.length === 0
              ? <p className="muted small">No friends yet. Add someone by username or player ID in Social.</p>
              : <ul>
                {liveFriends.slice(0, 4).map((f) => (
                  <li key={f.uid}>
                    <Avatar name={f.username} mark={f.mark} online={f.online} size={40} />
                    <span><b>{f.username}</b><small>{f.online ? 'Online now' : 'Offline'}</small></span>
                    {f.online && <button className="chip-btn small" onClick={() => { setInviteTarget(f); go('create-room') }}>Challenge</button>}
                  </li>
                ))}
              </ul>}
        </Reveal>
      </section>
    </div>
  )
}
