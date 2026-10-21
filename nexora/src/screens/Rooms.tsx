import { useEffect, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { useStart } from '../app/flow'
import { arenas, arenaById, friendsSeed } from '../data/nexo'
import { validCode } from '../game/rooms'
import { createRoom, inviteFriend, peekInviteTarget, joinRoom, leaveRoom, startMatch, takeInviteTarget, takeStart, useLive } from '../net/live'
import { useAccount } from '../net/account'
import { SignInGate } from '../components/SignInGate'
import { useProfile } from '../game/store'
import { Btn } from '../components/Btn'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { Nexo } from '../components/Nexo'
import { Segmented } from '../components/Segmented'
import { useToasts } from '../components/Toasts'
import { sfx } from '../motion/sound'
import type { ArenaId } from '../types'

export function CreateRoom() {
  const { go, arena } = useApp()
  const { playFriend } = useStart()
  const { notify } = useToasts()
  const { me } = useAccount()
  const target = useRef(peekInviteTarget())
  const [sel, setSel] = useState<ArenaId>(arena.id)
  const [mode, setMode] = useState(arenaById(arena.id).modes[0])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const a = arenaById(sel)
  const create = async () => {
    setBusy(true); setErr('')
    try {
      await createRoom(sel, mode)
      const t = takeInviteTarget()
      if (t) { try { await inviteFriend(t.uid); notify(`Invite sent to ${t.username}`) } catch (e) { notify(e instanceof Error ? e.message : 'Could not send the invite.') } }
      sfx('confirm'); go('lobby', { arena: sel })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not create the room.'); sfx('wrong') }
    setBusy(false)
  }
  const demo = () => { const f = friendsSeed.find((x) => x.online) ?? friendsSeed[0]; playFriend(sel, f, mode) }
  if (!me) return <SignInGate />
  return (
    <div className="page room stagger">
      <button className="back-link" onClick={() => go('friends')}><Icon name="back" size={18} />Social</button>
      <div className="page-head"><div><h1 className="t-xl">{target.current ? `Challenge ${target.current.username}` : 'Create a private room'}</h1><p className="lead">{target.current ? 'Pick an arena. We will send them the invite as soon as the room is ready.' : 'Pick an arena, share the code or invite a friend, and play a friendly five-round match.'}</p></div></div>
      <div className="room-grid">
        <div className="panel dark room-card">
          <h2 className="t-m">Arena</h2>
          <div className="room-arenas" role="radiogroup" aria-label="Arena">
            {arenas.map((x) => (
              <button key={x.id} role="radio" aria-checked={sel === x.id} className={`room-arena ${sel === x.id ? 'is-on' : ''}`} style={{ ['--accent' as string]: `var(--${x.id})` }} onClick={() => { setSel(x.id); setMode(x.modes[0]) }}>
                <i />{x.name}
              </button>
            ))}
          </div>
          <h2 className="t-m">Mode</h2>
          <Segmented label="Mode" options={a.modes.map((m) => ({ value: m, label: m }))} value={mode} onChange={setMode} tone={`var(--${sel})`} />
        </div>
        <div className="panel room-card room-sum">
          <h2 className="t-m">Room summary</h2>
          <ul>
            <li><span>Arena</span><b>{a.name}</b></li>
            <li><span>Mode</span><b>{mode}</b></li>
            <li><span>Players</span><b>2, live</b></li>
            <li><span>Rounds</span><b>5</b></li>
            <li><span>Ranking</span><b>Friendly (no ELO)</b></li>
          </ul>
          {err && <p className="field-msg" role="alert">{err}</p>}
          <Btn size="lg" variant="peach" icon="plus" busy={busy} onClick={create}>Create room</Btn>
          {err && <Btn size="md" variant="ghost" onClick={demo}>Play NEXO instead</Btn>}
        </div>
      </div>
    </div>
  )
}

export function JoinRoom() {
  const { go } = useApp()
  const { me } = useAccount()
  const [code, setCode] = useState('NX-')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validCode(code)) { setErr('Enter a code like NX-48291.'); sfx('wrong'); return }
    setErr(''); setBusy(true)
    try {
      const room = await joinRoom(code.trim().toUpperCase())
      sfx('confirm'); go('lobby', { arena: room.arena })
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Could not join the room.'); sfx('wrong') }
    setBusy(false)
  }
  if (!me) return <SignInGate />
  return (
    <div className="page room stagger">
      <button className="back-link" onClick={() => go('friends')}><Icon name="back" size={18} />Social</button>
      <div className="join-card panel">
        <Nexo mood="search" size={130} />
        <h1 className="t-l">Join a room</h1>
        <p className="muted">Ask your friend for the room code.</p>
        <form onSubmit={submit} noValidate className="join-form">
          <label className={`field ${err ? 'has-error' : ''}`} htmlFor="room-code">
            <input id="room-code" value={code} placeholder=" " maxLength={8} autoComplete="off" autoCapitalize="characters" onChange={(e) => setCode(e.target.value.toUpperCase())} aria-invalid={!!err} />
            <span>Room code</span>
          </label>
          {err && <span className="field-msg" role="alert">{err}</span>}
          <Btn type="submit" size="lg" variant="peach" busy={busy}>Join room</Btn>
        </form>
      </div>
    </div>
  )
}

export function Lobby() {
  const { go } = useApp()
  const { playLive } = useStart()
  const { notify } = useToasts()
  const p = useProfile()
  const live = useLive()
  const room = live.room
  const [copied, setCopied] = useState('')
  const [invited, setInvited] = useState<string[]>([])
  const host = room?.you === 'host'
  const rival = room ? (host ? room.guest : room.host) : null

  // the host started a match (or started one while we were on the result screen)
  useEffect(() => {
    if (!room || !live.start) return
    const s = takeStart()
    if (s && rival) playLive(room.arena, rival, room.mode, s.seed, s.items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.start, room])

  const prev = useRef<string | null>(null)
  useEffect(() => {
    const name = rival?.name ?? null
    if (name && prev.current !== name) { sfx('confirm') }
    prev.current = name
  }, [rival])

  if (!room) {
    return (
      <div className="page empty">
        <Nexo mood="think" size={150} speech={live.closed ? 'The host left.' : 'No room yet.'} />
        <h1 className="t-l">{live.closed ? 'The host closed this room.' : 'Create or join a room first.'}</h1>
        <div className="hub-cta"><Btn variant="peach" onClick={() => go('create-room')}>Create room</Btn><Btn variant="ghost" onClick={() => go('join-room')}>Join with code</Btn></div>
      </div>
    )
  }
  const a = arenaById(room.arena)
  const copy = async (what: 'code' | 'invite') => {
    const text = what === 'code' ? room.code : `Join my NEXORA room ${room.code}: ${location.origin}/#/join-room`
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
    setCopied(what); sfx('confirm'); window.setTimeout(() => setCopied(''), 1800)
  }
  const leave = () => { leaveRoom(); go('friends') }
  const invite = async (f: { uid: string; username: string }) => {
    try { await inviteFriend(f.uid); setInvited((l) => [...l, f.uid]); notify(`Invite sent to ${f.username}`) } catch (e) { notify(e instanceof Error ? e.message : 'Could not send the invite.') }
  }
  const onlineFriends = live.friends.filter((f) => f.online)

  return (
    <div className="page room stagger" style={{ ['--accent' as string]: `var(--${a.id})` }}>
      <button className="back-link" onClick={leave}><Icon name="back" size={18} />Leave room</button>
      <div className="lobby">
        <div className="panel dark lobby-code">
          <small className="muted">Room code</small>
          <b className="display lobby-id" aria-label={`Room code ${room.code}`}>{room.code}</b>
          <div className="lobby-copy">
            <Btn variant="cream" size="sm" icon={copied === 'code' ? 'check' : 'copy'} cue="click" onClick={() => copy('code')}>{copied === 'code' ? 'Copied' : 'Copy code'}</Btn>
            <Btn variant="ghost" size="sm" icon={copied === 'invite' ? 'check' : 'copy'} cue="click" onClick={() => copy('invite')}>{copied === 'invite' ? 'Copied' : 'Copy invite'}</Btn>
          </div>
          <p className="muted small">{a.name} · {room.mode} · 5 rounds · Friendly</p>
        </div>
        <div className="lobby-slots">
          <div className="slot is-in"><Avatar name={p.name} size={84} /><b className="display">{p.name}</b><span className="chip mint">{host ? 'Host' : 'You'}</span></div>
          <div className="slot-vs">VS</div>
          {rival
            ? <div className="slot is-in is-pop" key={rival.name}><Avatar name={rival.name} mark={rival.mark} size={84} /><b className="display">{rival.name.toUpperCase()}</b><span className="chip mint">{host ? 'Joined' : 'Host'}</span></div>
            : <div className="slot is-wait"><div className="slot-q">?</div><b className="display">Waiting for a friend</b><small className="muted">Share the code above</small></div>}
        </div>
        {host && !rival && (
          <div className="panel lobby-friends">
            <h2 className="t-m">Invite a friend</h2>
            {onlineFriends.length === 0
              ? <p className="muted small">{live.friends.length ? 'None of your friends are online right now. Share the code instead.' : 'Add friends in Social to invite them here, or share the code.'}</p>
              : <ul>{onlineFriends.map((f) => (
                <li key={f.uid}><Avatar name={f.username} mark={f.mark} online size={40} /><b>{f.username}</b>
                  <Btn size="sm" variant={invited.includes(f.uid) ? 'ghost' : 'peach'} disabled={invited.includes(f.uid)} onClick={() => invite(f)}>{invited.includes(f.uid) ? 'Invited' : 'Invite'}</Btn></li>
              ))}</ul>}
          </div>
        )}
        <div className="lobby-actions" aria-live="polite">
          {host
            ? <Btn size="lg" variant="peach" icon="play" disabled={!rival} onClick={() => { startMatch(); notify('Starting match') }}>{rival ? 'Start match' : 'Waiting for friend'}</Btn>
            : <Btn size="lg" variant="peach" icon="check" busy disabled>Waiting for {room.host.name} to start</Btn>}
        </div>
      </div>
    </div>
  )
}
