import { useEffect, useState, type ReactNode } from 'react'
import { useApp } from '../app/context'
import { dailyArena, todayKey, useStart } from '../app/flow'
import { allOpponents, arenaById, arenas, nexo, opponentById } from '../data/nexo'
import { achievementDefs } from '../game/achievements'
import { dismiss, markAllRead, markRead, useNotifs } from '../game/notif'
import { freshProfile, getProfile, resetProfile, setProfile, useProfile } from '../game/store'
import { logout, useAccount } from '../net/account'
import { updateSettings, useSettings } from '../settings'
import { Avatar } from '../components/Avatar'
import { Btn } from '../components/Btn'
import { Icon, type IconName } from '../components/Icon'
import { Nexo } from '../components/Nexo'
import { Segmented } from '../components/Segmented'
import { useToasts } from '../components/Toasts'
import { XPBar } from '../components/XPBar'
import { CountUp } from '../motion/CountUp'
import { Reveal } from '../motion/Reveal'
import { sfx } from '../motion/sound'

const when = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* ---------------------------------- daily --------------------------------- */
export function Daily() {
  const { go } = useApp()
  const { play } = useStart()
  const p = useProfile()
  const a = arenaById(dailyArena())
  const done = p.dailyDone === todayKey()
  const [left, setLeft] = useState(0)
  useEffect(() => {
    const tick = () => { const n = new Date(); const end = new Date(n); end.setHours(24, 0, 0, 0); setLeft(Math.floor((end.getTime() - n.getTime()) / 1000)) }
    tick()
    const i = window.setInterval(tick, 1000)
    return () => window.clearInterval(i)
  }, [])
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const dow = (new Date().getDay() + 6) % 7
  return (
    <div className="page daily-page stagger" style={{ ['--accent' as string]: `var(--${a.id})` }}>
      <div className="page-head"><div><h1 className="t-xl">Daily challenge</h1><p className="lead">One fresh arena every day. Unranked, with bonus XP.</p></div></div>
      <div className="dc-grid">
        <div className="dc-main panel dark">
          <span className="chip peach"><Icon name="clock" size={14} />Resets in {Math.floor(left / 3600)}h {Math.floor((left % 3600) / 60)}m</span>
          <h2 className="t-xl dc-arena">{a.name}</h2>
          <p className="lead">{a.challenge}</p>
          <div className="dc-rewards"><span className="chip mint">+150 XP</span><span className="chip lav">Keeps your daily streak</span></div>
          <Btn size="lg" variant="peach" icon="play" magnetic disabled={done} onClick={() => play(a.id, a.ai, 'daily', { ranked: false })}>{done ? 'Completed today' : 'Start challenge'}</Btn>
        </div>
        <div className="panel dc-week">
          <h2 className="t-m">This week</h2>
          <ol>{days.map((d, i) => <li key={i} className={i < dow ? 'is-past' : i === dow ? (done ? 'is-done' : 'is-today') : ''}><span>{d}</span>{(i === dow && done) || (i < dow && i >= dow - Math.min(p.streak, 6)) ? <Icon name="check" size={16} /> : null}</li>)}</ol>
          <p className="muted small">{p.streak > 0 ? `${p.streak}-win streak going.` : 'Win a match to start a streak.'}</p>
          <button className="link-btn" onClick={() => go('hub')}>Back to hub</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- achievements ----------------------------- */
export function Achievements() {
  const p = useProfile()
  const earned = achievementDefs.filter((a) => p.achievements[a.id]).length
  return (
    <div className="page stagger">
      <div className="page-head"><div><h1 className="t-xl">Achievements</h1><p className="lead">{earned} of {achievementDefs.length} unlocked.</p></div></div>
      <div className="ach-grid">
        {achievementDefs.map((a, i) => {
          const got = p.achievements[a.id]
          const val = a.value ? Math.min(a.value(p), a.target ?? 1) : got ? 1 : 0
          const target = a.target ?? 1
          return (
            <Reveal key={a.id} variant="scale" delay={(i % 4) * 70} className={`ach-card ${got ? 'is-got' : ''}`}>
              <span className="ach-medal">{got ? <Icon name="trophy" size={28} /> : <Icon name="lock" size={24} />}</span>
              <b className="display">{a.name}</b>
              <small>{a.note}</small>
              {a.target && !got ? <><XPBar value={val / target} label={`${a.name} progress`} height={8} color="lavender" /><em>{val} / {target}</em></> : <em>{got ? `Unlocked ${when(got)}` : 'Locked'} · +{a.xp} XP</em>}
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

/* --------------------------------- history -------------------------------- */
export function History() {
  const { go, setAiId } = useApp()
  const p = useProfile()
  const [f, setF] = useState<'all' | 'win' | 'loss'>('all')
  const list = p.history.filter((m) => f === 'all' || m.result === f)
  return (
    <div className="page stagger">
      <div className="page-head"><div><h1 className="t-xl">Match history</h1><p className="lead">Your last {p.history.length} matches.</p></div><Segmented label="Result filter" value={f} onChange={setF} options={[{ value: 'all', label: 'All' }, { value: 'win', label: 'Wins' }, { value: 'loss', label: 'Losses' }]} /></div>
      <ul className="hist">
        {list.map((m) => (
          <li key={m.id}>
            <button className="hist-row" onClick={() => { setAiId(m.id); go('match-details') }}>
              <span className={`res res-${m.result}`}>{m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D'}</span>
              <span className="hist-main"><b className="display">{arenaById(m.arena).name} vs {m.opponent}</b><small>{when(m.at)} · {m.ranked ? 'Ranked' : 'Unranked'} · {mmss(m.durationSec)}</small></span>
              <span className="hist-score count">{m.playerScore} : {m.rivalScore}</span>
              <em className={m.eloDelta >= 0 ? 'up' : 'down'}>{m.ranked ? `${m.eloDelta >= 0 ? '+' : ''}${m.eloDelta}` : 'n/a'}</em>
              <Icon name="arrow" size={18} />
            </button>
          </li>
        ))}
      </ul>
      {list.length === 0 && <div className="soc-empty"><Nexo mood="think" size={120} speech="Nothing here yet." /></div>}
    </div>
  )
}

export function MatchDetails() {
  const { go, aiId } = useApp()
  const { play } = useStart()
  const p = useProfile()
  const m = p.history.find((x) => x.id === aiId) ?? p.history[0]
  if (!m) return <div className="page empty"><Nexo mood="think" size={140} /><h1 className="t-l">No matches yet.</h1><Btn variant="peach" onClick={() => go('arenas')}>Play one</Btn></div>
  const opp = allOpponents.find((o) => o.name === m.opponent) ?? nexo
  const a = arenaById(m.arena)
  return (
    <div className="page stagger" style={{ ['--accent' as string]: `var(--${a.id})` }}>
      <button className="back-link" onClick={() => go('history')}><Icon name="back" size={18} />History</button>
      <div className="md panel dark">
        <span className={`res res-${m.result}`} style={{ width: 64, height: 64, fontSize: '1.8rem', borderRadius: 20 }}>{m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D'}</span>
        <div><h1 className="t-l">{a.name} vs {m.opponent}</h1><p className="muted">{m.id} · {when(m.at)} · {m.ranked ? 'Ranked' : 'Unranked'}</p></div>
        <div className="md-score display">{m.playerScore}<i>:</i>{m.rivalScore}</div>
      </div>
      <div className="aid-grid" style={{ marginTop: 20 }}>
        <div className="panel"><small className="muted">ELO change</small><b className="display aid-big">{m.ranked ? `${m.eloDelta >= 0 ? '+' : ''}${m.eloDelta}` : 'n/a'}</b></div>
        <div className="panel"><small className="muted">XP earned</small><b className="display aid-big">+{m.xp}</b></div>
        <div className="panel"><small className="muted">Duration</small><b className="display aid-big">{mmss(m.durationSec)}</b></div>
        <div className="panel"><small className="muted">Rival</small><b className="display aid-mid">{m.opponent}</b><small className="muted">{opponentById(opp.id).role}</small></div>
      </div>
      <div className="hub-cta" style={{ marginTop: 24 }}><Btn size="lg" variant="peach" icon="refresh" onClick={() => play(m.arena, opp.id, opp.id === 'nexo' ? 'nexo' : 'specialist')}>Rematch</Btn></div>
    </div>
  )
}

/* ------------------------------- tournaments ------------------------------ */
const events = [
  { id: 'circuit', name: 'Open Circuit', season: 'Season 04', note: 'Single elimination across all six arenas.', status: 'Qualifiers in 48 hours', slots: '212 / 256', prize: '1,500 XP and a rank badge', tone: 'lav' },
  { id: 'mind-cup', name: 'Mind Cup', season: 'Weekend', note: 'Patterns, memory and reflexes only.', status: 'Starts Saturday', slots: '88 / 128', prize: '800 XP', tone: 'mint' },
  { id: 'roast-off', name: 'Roast-off', season: 'Friday night', note: 'Eight players, one mic.', status: 'Registration open', slots: '5 / 8', prize: '500 XP', tone: 'peach' },
]
export function Tournaments() {
  const { go } = useApp()
  const { notify } = useToasts()
  const [joined, setJoined] = useState<string[]>(['roast-off'])
  return (
    <div className="page stagger">
      <div className="page-head"><div><h1 className="t-xl">Tournaments</h1><p className="lead">Seasonal brackets. Event data in this build is sample content.</p></div></div>
      <div className="ev-list">
        {events.map((e) => {
          const on = joined.includes(e.id)
          return (
            <div className={`ev ev-${e.tone}`} key={e.id}>
              <div><span className="chip">{e.season}</span><h2 className="t-l">{e.name}</h2><p className="muted">{e.note}</p></div>
              <ul><li><small>Status</small><b>{e.status}</b></li><li><small>Entries</small><b className="count">{e.slots}</b></li><li><small>Prize</small><b>{e.prize}</b></li></ul>
              <div className="ev-act">
                <Btn variant={on ? 'ghost' : 'peach'} icon={on ? 'check' : 'plus'} onClick={() => { setJoined((l) => (on ? l.filter((x) => x !== e.id) : [...l, e.id])); notify(on ? `Left ${e.name}` : `Registered for ${e.name}`) }}>{on ? 'Registered' : 'Register'}</Btn>
                <button className="link-btn" onClick={() => go('bracket')}>View bracket</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Bracket() {
  const { go } = useApp()
  const { play } = useStart()
  const p = useProfile()
  const qf = [[p.name, 'ARLO'], ['MIKA', 'SAKI'], ['NOAH', 'DRIFT'], ['LUNA-K', 'ECHO.9']]
  const sf = [[p.name, 'MIKA'], ['NOAH', 'LUNA-K']]
  const cell = (n: string, win?: boolean) => <div className={`br-p ${n === p.name ? 'is-you' : ''} ${win ? 'is-win' : ''}`}><Avatar name={n} size={26} />{n}</div>
  return (
    <div className="page stagger">
      <button className="back-link" onClick={() => go('tournaments')}><Icon name="back" size={18} />Tournaments</button>
      <div className="page-head"><div><h1 className="t-xl">Roast-off bracket</h1><p className="lead">Eight players. You open against ARLO.</p></div><Btn variant="peach" icon="play" onClick={() => play('roast', 'roastai', 'practice', { ranked: false })}>Play your match</Btn></div>
      <div className="bracket" role="group" aria-label="Bracket">
        <div className="br-col"><h3>Quarterfinals</h3>{qf.map((m, i) => <div key={i} className="br-match">{cell(m[0], i === 0)}{cell(m[1])}</div>)}</div>
        <div className="br-col br-mid"><h3>Semifinals</h3>{sf.map((m, i) => <div key={i} className="br-match">{cell(m[0])}{cell(m[1])}</div>)}</div>
        <div className="br-col br-final"><h3>Final</h3><div className="br-match"><div className="br-p">Winner of 1</div><div className="br-p">Winner of 2</div></div><Icon name="trophy" size={44} className="br-trophy" /></div>
      </div>
    </div>
  )
}

/* ------------------------------ notifications ----------------------------- */
const nIcon: Record<string, IconName> = { invite: 'users', friend: 'users', rank: 'trophy', nexo: 'bolt', event: 'crown' }
export function Notifications() {
  const { go } = useApp()
  const items = useNotifs()
  const unread = items.filter((n) => n.unread).length
  return (
    <div className="page stagger">
      <div className="page-head"><div><h1 className="t-xl">Notifications</h1><p className="lead">{unread ? `${unread} new` : 'You are all caught up.'}</p></div>{unread > 0 && <Btn variant="ghost" icon="check" cue="click" onClick={markAllRead}>Mark all read</Btn>}</div>
      <ul className="nlist">
        {items.map((n) => (
          <li key={n.id} className={`nrow ${n.unread ? 'is-new' : ''}`}>
            <span className="nrow-ico"><Icon name={nIcon[n.kind] ?? 'bell'} size={22} /></span>
            <span className="nrow-main"><b className="display">{n.title}</b><small>{n.note} · {n.age === 'now' ? 'just now' : `${n.age} ago`}</small></span>
            {n.kind === 'invite' && <Btn size="sm" variant="peach" onClick={() => { markRead(n.id); go('join-room') }}>Join</Btn>}
            {n.kind === 'friend' && <Btn size="sm" variant="primary" onClick={() => { markRead(n.id); go('friends') }}>Open</Btn>}
            {n.kind === 'nexo' && <Btn size="sm" variant="primary" onClick={() => { markRead(n.id); go('mind') }}>Train</Btn>}
            <button className="icon-btn" aria-label={`Dismiss ${n.title}`} onClick={() => { sfx('click'); dismiss(n.id) }}><Icon name="close" size={18} /></button>
          </li>
        ))}
      </ul>
      {items.length === 0 && <div className="soc-empty"><Nexo mood="happy" size={130} speech="Nothing new. Go play!" /></div>}
    </div>
  )
}

/* --------------------------------- settings ------------------------------- */
function Row({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return <div className="set-row"><div><b className="display">{title}</b><small>{note}</small></div>{children}</div>
}
function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => { onChange(!on); sfx('click') }} />
}

export function Settings() {
  const { go } = useApp()
  const { notify } = useToasts()
  const s = useSettings()
  const p = useProfile()
  const { me } = useAccount()
  const [name, setName] = useState(p.name)
  const [confirm, setConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyUid = async () => { if (!me) return; try { await navigator.clipboard.writeText(me.uid) } catch { /* ignore */ } setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
  const saveName = () => { const n = name.trim().toUpperCase().slice(0, 14); if (n.length < 2) return; setProfile({ ...getProfile(), name: n }); notify('Name saved') }
  return (
    <div className="page stagger settings">
      <div className="page-head"><div><h1 className="t-xl">Settings</h1><p className="lead">Everything saves on this device.</p></div></div>
      <div className="set-grid">
        <section className="panel dark set-card">
          <h2 className="t-m">Profile</h2>
          {me ? (
            <div className="set-acct">
              <Row title={me.username} note={`Player ID ${me.uid}`}><Btn size="sm" variant="primary" icon={copied ? 'check' : 'copy'} cue="click" onClick={copyUid}>{copied ? 'Copied' : 'Copy ID'}</Btn></Row>
            </div>
          ) : (
            <form className="set-name" onSubmit={(e) => { e.preventDefault(); saveName() }}>
              <label className="field" htmlFor="set-name"><input id="set-name" value={name} maxLength={14} placeholder=" " onChange={(e) => setName(e.target.value)} /><span>Display name</span></label>
              <Btn type="submit" size="sm" variant="primary" icon="check">Save</Btn>
            </form>
          )}
        </section>
        <section className="panel dark set-card">
          <h2 className="t-m">Experience</h2>
          <Row title="Sound effects" note="Off by default. Never plays on its own."><Switch on={s.sound} onChange={(v) => updateSettings({ sound: v })} label="Sound effects" /></Row>
          <Row title="Animations" note="Turn off to reduce motion. Also follows your device setting."><Switch on={s.motion} onChange={(v) => updateSettings({ motion: v })} label="Animations" /></Row>
          <Row title="High contrast" note="Stronger text and borders."><Switch on={s.contrast} onChange={(v) => updateSettings({ contrast: v })} label="High contrast" /></Row>
          <Row title="Friend invites" note="Let friends invite you to rooms."><Switch on={s.invites} onChange={(v) => updateSettings({ invites: v })} label="Friend invites" /></Row>
        </section>
        <section className="panel dark set-card">
          <h2 className="t-m">Your data</h2>
          <Row title="Reset progress" note={me ? 'Starts your rating, XP and history over on this device. This cannot be undone.' : 'Restores the demo profile. This cannot be undone.'}>
            <Btn size="sm" variant={confirm ? 'pink' : 'ghost'} icon="refresh" cue="click" onClick={() => { if (confirm) { if (me) setProfile(freshProfile(me.username, true, me.uid)); else resetProfile(); setConfirm(false); notify('Progress reset') } else setConfirm(true) }}>{confirm ? 'Click again to confirm' : 'Reset'}</Btn>
          </Row>
          <Row title="Sign out" note={me ? `Signed in as ${me.username}.` : 'Return to the start page.'}><Btn size="sm" variant="ghost" icon="back" onClick={async () => { await logout(); go('landing') }}>Sign out</Btn></Row>
        </section>
        <section className="panel dark set-card set-about">
          <Nexo mood="wink" size={110} />
          <p className="muted">NEXO is an AI and so are the six specialists. Accounts, friends and rooms are live. Online counts, rankings and tournaments are still sample data.</p>
          <span className="chip">{arenas.length} arenas · {achievementDefs.length} achievements</span>
        </section>
      </div>
      <span className="sr-only"><CountUp to={0} /></span>
    </div>
  )
}
