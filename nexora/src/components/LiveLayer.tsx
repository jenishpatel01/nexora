import { useEffect, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { arenaById } from '../data/nexo'
import { addNotif } from '../game/notif'
import { useProfile } from '../game/store'
import { acceptInvite, declineInvite, dismissInvite, onLiveEvent, sendElo, useLive, type Invite } from '../net/live'
import { useAccount } from '../net/account'
import { useSettings } from '../settings'
import { sfx } from '../motion/sound'
import { Avatar } from './Avatar'
import { Btn } from './Btn'
import { useToasts } from './Toasts'

const INVITE_MS = 90000

/** the always-on part of multiplayer: invite cards, friend toasts and rating sync */
export function LiveLayer() {
  const { go } = useApp()
  const { notify } = useToasts()
  const { me } = useAccount()
  const live = useLive()
  const settings = useSettings()
  const profile = useProfile()
  const [busy, setBusy] = useState<number | null>(null)
  const accepting = useRef(false)

  useEffect(() => onLiveEvent((e) => {
    if (e.kind === 'request') { sfx('confirm'); notify(`${e.from.username} sent you a friend request`); addNotif({ kind: 'friend', title: `${e.from.username} wants to be friends`, note: `Player ${e.from.uid}` }) }
    else if (e.kind === 'accepted') { sfx('confirm'); notify(`${e.from.username} is now your friend`); addNotif({ kind: 'friend', title: `${e.from.username} accepted your request`, note: 'You can challenge them now' }) }
    else if (e.kind === 'declined') notify(`${e.from.username} declined your invite`)
    else if (e.kind === 'invite') {
      sfx('match-start')
      addNotif({ kind: 'invite', title: `${e.invite.from.username} invited you`, note: `${arenaById(e.invite.arena).name}, private room ${e.invite.code}` })
    }
  }), [notify])

  // invites switched off in Settings are declined quietly
  useEffect(() => {
    if (!settings.invites) for (const i of live.invites) declineInvite(i)
  }, [settings.invites, live.invites])

  // an invite that nobody answered goes away
  useEffect(() => {
    if (!live.invites.length) return
    const t = window.setInterval(() => { const now = Date.now(); for (const i of live.invites) if (now - i.at > INVITE_MS) dismissInvite(i.id) }, 3000)
    return () => window.clearInterval(t)
  }, [live.invites])

  // keep the server's copy of our rating current so friends see it
  useEffect(() => { if (me && live.online) sendElo(profile.elo) }, [me, live.online, profile.elo])

  const accept = async (inv: Invite) => {
    if (accepting.current) return
    accepting.current = true; setBusy(inv.id)
    try { const room = await acceptInvite(inv); sfx('confirm'); go('lobby', { arena: room.arena }) } catch (e) { notify(e instanceof Error ? e.message : 'Could not join that room.'); sfx('wrong') }
    accepting.current = false; setBusy(null)
  }

  if (!me || !settings.invites || live.invites.length === 0) return null
  return (
    <div className="invites" role="region" aria-label="Game invites">
      {live.invites.map((inv) => (
        <div className="invite-card" key={inv.id} role="alertdialog" aria-label={`${inv.from.username} invited you`}>
          <Avatar name={inv.from.username} mark={inv.from.mark} size={48} />
          <span className="invite-text"><b className="display">{inv.from.username} challenged you</b><small>{arenaById(inv.arena).name} · {inv.mode} · 5 rounds</small></span>
          <span className="invite-btns">
            <Btn size="sm" variant="peach" icon="play" busy={busy === inv.id} onClick={() => accept(inv)}>Accept</Btn>
            <Btn size="sm" variant="ghost" onClick={() => { declineInvite(inv); sfx('click') }}>Decline</Btn>
          </span>
        </div>
      ))}
    </div>
  )
}
