import { useEffect, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { Avatar } from '../components/Avatar'
import { Btn } from '../components/Btn'
import { Icon } from '../components/Icon'
import { Nexo } from '../components/Nexo'
import { Segmented } from '../components/Segmented'
import { SignInGate } from '../components/SignInGate'
import { useToasts } from '../components/Toasts'
import { rankInfo } from '../game/progression'
import { useAccount } from '../net/account'
import { acceptFriend, cancelRequest, declineFriend, searchPlayers, sendFriendRequest, setInviteTarget, useLive, type Person, type SearchHit } from '../net/live'
import { sfx } from '../motion/sound'

type Tab = 'friends' | 'requests' | 'find'

export function Friends() {
  const { go, setAiId } = useApp()
  const { notify } = useToasts()
  const { me } = useAccount()
  const live = useLive()
  const [tab, setTab] = useState<Tab>('friends')
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const seq = useRef(0)

  // search as you type, with a short pause so we do not ask the server for every keystroke
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setHits(null); setSearching(false); setSearchErr(''); return }
    setSearching(true)
    const id = ++seq.current
    const t = window.setTimeout(async () => {
      try {
        const r = await searchPlayers(term)
        if (id === seq.current) { setHits(r); setSearchErr('') }
      } catch (e) { if (id === seq.current) { setHits(null); setSearchErr(e instanceof Error ? e.message : 'Search failed.') } }
      if (id === seq.current) setSearching(false)
    }, 320)
    return () => window.clearTimeout(t)
  }, [q, live.friends, live.incoming, live.outgoing])

  if (!me) return <SignInGate title="Sign in to find friends" note="Create an account to get your player ID. Friends can add you by username or ID, then you can play each other live." />

  const act = async (id: string, fn: () => Promise<unknown>, done?: string) => {
    setBusyId(id)
    try { await fn(); if (done) notify(done); sfx('confirm') } catch (e) { notify(e instanceof Error ? e.message : 'Something went wrong.'); sfx('wrong') }
    setBusyId(null)
  }
  const add = (h: Person) => act(h.uid, async () => { const r = await sendFriendRequest(h.uid); notify(r.became ? `You and ${h.username} are now friends` : `Request sent to ${h.username}`) })
  const challenge = (f: Person) => { setInviteTarget(f); go('create-room') }
  const copy = async () => { try { await navigator.clipboard.writeText(me.uid) } catch { /* ignore */ } setCopied(true); sfx('confirm'); window.setTimeout(() => setCopied(false), 1800) }

  const onlineFirst = [...live.friends].sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username))
  const pendingCount = live.incoming.length

  return (
    <div className="page social stagger">
      <div className="page-head">
        <div><h1 className="t-xl">Social</h1><p className="lead">Add friends by username or player ID, then challenge them to a live match.</p></div>
        <div className="hub-cta"><Btn variant="peach" icon="plus" onClick={() => go('create-room')}>Create room</Btn><Btn variant="ghost" onClick={() => go('join-room')}>Join with code</Btn></div>
      </div>
      {!live.online && <p className="soc-banner" role="status">{live.connecting ? 'Connecting to the server...' : 'Reconnecting to the server. Friends update when it is back.'}</p>}
      <div className="soc-grid">
        <div>
          <Segmented label="Social tabs" value={tab} onChange={setTab} options={[
            { value: 'friends', label: `Friends ${live.friends.length}` },
            { value: 'requests', label: pendingCount ? `Requests ${pendingCount}` : 'Requests' },
            { value: 'find', label: 'Add friends' },
          ]} />
          <div className="soc-list" role="tabpanel">
            {tab === 'friends' && (onlineFirst.length === 0
              ? <div className="soc-empty"><Nexo mood="wink" size={120} speech="No friends yet." /><p className="muted">Add someone by username or player ID, or share yours.</p><Btn variant="peach" icon="plus" onClick={() => setTab('find')}>Add friends</Btn></div>
              : onlineFirst.map((f) => (
                <div className="soc-row" key={f.uid}>
                  <button className="soc-main" onClick={() => { setAiId(f.uid); go('friend-profile') }}>
                    <Avatar name={f.username} mark={f.mark} online={f.online} size={52} />
                    <span><b className="display">{f.username}</b><small>{f.online ? 'Online now' : 'Offline'}</small></span>
                    <span className="soc-rank">{rankInfo(f.elo).label}</span>
                  </button>
                  <Btn size="sm" variant={f.online ? 'peach' : 'ghost'} icon="swords" disabled={!f.online} onClick={() => challenge(f)}>{f.online ? 'Challenge' : 'Offline'}</Btn>
                </div>
              )))}

            {tab === 'requests' && (live.incoming.length === 0 && live.outgoing.length === 0
              ? <div className="soc-empty"><Nexo mood="happy" size={120} speech="All caught up." /></div>
              : <>
                {live.incoming.map((r) => (
                  <div className="soc-row" key={r.uid}>
                    <div className="soc-main"><Avatar name={r.username} mark={r.mark} size={52} /><span><b className="display">{r.username}</b><small>Wants to be friends</small></span></div>
                    <div className="soc-btns">
                      <Btn size="sm" variant="mint" icon="check" busy={busyId === r.uid} onClick={() => act(r.uid, () => acceptFriend(r.uid), `${r.username} is now your friend`)}>Accept</Btn>
                      <button className="icon-btn" aria-label={`Decline ${r.username}`} onClick={() => act(r.uid, () => declineFriend(r.uid))}><Icon name="close" size={18} /></button>
                    </div>
                  </div>
                ))}
                {live.outgoing.length > 0 && <h3 className="soc-sub">Sent by you</h3>}
                {live.outgoing.map((r) => (
                  <div className="soc-row" key={r.uid}>
                    <div className="soc-main"><Avatar name={r.username} mark={r.mark} size={44} /><span><b className="display">{r.username}</b><small>Waiting for them to accept</small></span></div>
                    <Btn size="sm" variant="ghost" busy={busyId === r.uid} onClick={() => act(r.uid, () => cancelRequest(r.uid), 'Request cancelled')}>Cancel</Btn>
                  </div>
                ))}
              </>)}

            {tab === 'find' && (
              <div className="soc-find">
                <label className="field" htmlFor="find-q"><input id="find-q" value={q} placeholder=" " onChange={(e) => setQ(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} /><span>Username or player ID</span></label>
                {searchErr && <p className="field-msg" role="alert">{searchErr}</p>}
                {!q.trim() && <p className="muted">Type a username, or paste a player ID like NXU-7K2M9Q.</p>}
                {q.trim().length === 1 && <p className="muted">Keep typing. Search needs at least 2 characters.</p>}
                {searching && !hits && <p className="muted">Searching...</p>}
                {hits && hits.length === 0 && !searching && <p className="muted">No player found for "{q.trim()}". Check the spelling, or ask for their player ID.</p>}
                {hits?.map((h) => (
                  <div className="soc-row" key={h.uid}>
                    <div className="soc-main"><Avatar name={h.username} mark={h.mark} size={44} /><span><b className="display">{h.username}</b><small>{h.uid}</small></span></div>
                    {h.relation === 'none' && <Btn size="sm" variant="peach" icon="plus" busy={busyId === h.uid} onClick={() => add(h)}>Add friend</Btn>}
                    {h.relation === 'outgoing' && <Btn size="sm" variant="ghost" disabled>Requested</Btn>}
                    {h.relation === 'incoming' && <Btn size="sm" variant="mint" icon="check" busy={busyId === h.uid} onClick={() => act(h.uid, () => acceptFriend(h.uid), `${h.username} is now your friend`)}>Accept</Btn>}
                    {h.relation === 'friend' && <span className="chip mint">Friends</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside className="panel soc-code">
          <Nexo mood="wink" size={120} />
          <h2 className="t-m">Your player ID</h2>
          <b className="display lobby-id" style={{ color: 'var(--lav-ink)', fontSize: '2.1rem' }} aria-label={`Player ID ${me.uid}`}>{me.uid}</b>
          <p className="muted small">Signed in as <b>{me.username}</b></p>
          <Btn variant="primary" size="sm" icon={copied ? 'check' : 'copy'} cue="click" onClick={copy}>{copied ? 'Copied' : 'Copy ID'}</Btn>
          <p className="muted small">Share this ID. Friends search it under Add friends.</p>
        </aside>
      </div>
    </div>
  )
}
