import { useSyncExternalStore } from 'react'
import type { ArenaId } from '../types'
import type { RoundResult } from '../game/types'
import { getProfile } from '../game/store'
import { dropToken, getAccount, getToken, subscribeAccount } from './account'
import { wsUrl } from './config'

export type LivePlayer = { uid: string; name: string; mark: string; elo: number }
export type LiveRoom = { code: string; arena: ArenaId; mode: string; you: 'host' | 'guest'; host: LivePlayer; guest: LivePlayer | null }
export type Person = { uid: string; username: string; mark: string }
export type Friend = Person & { elo: number; online: boolean }
export type SearchHit = Person & { relation: 'none' | 'friend' | 'incoming' | 'outgoing' | 'self' }
export type Invite = { id: number; from: Person; code: string; arena: ArenaId; mode: string; at: number }

export type LiveState = {
  /** the socket is open and the server accepted our sign-in */
  online: boolean
  connecting: boolean
  room: LiveRoom | null
  /** set when the host starts a match; bumps on every start so a rematch is a new event */
  start: { seed: number; n: number } | null
  /** rival results by round index */
  answers: Record<number, RoundResult>
  /** the other player left or dropped */
  rivalGone: boolean
  /** room closed by the host */
  closed: boolean
  friends: Friend[]
  incoming: Person[]
  outgoing: Person[]
  invites: Invite[]
}

export type LiveEvent =
  | { kind: 'request'; from: Person }
  | { kind: 'accepted'; from: Person }
  | { kind: 'invite'; invite: Invite }
  | { kind: 'declined'; from: Person }

const initial: LiveState = { online: false, connecting: false, room: null, start: null, answers: {}, rivalGone: false, closed: false, friends: [], incoming: [], outgoing: [], invites: [] }
let state: LiveState = initial
let ws: WebSocket | null = null
let startN = 0
let inviteN = 0
let retry = 0
let retryTimer = 0
const subs = new Set<() => void>()
const eventSubs = new Set<(e: LiveEvent) => void>()
const set = (patch: Partial<LiveState>) => { state = { ...state, ...patch }; subs.forEach((f) => f()) }
const emit = (e: LiveEvent) => eventSubs.forEach((f) => f(e))

export const getLive = () => state
export const useLive = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => state)
export const onLiveEvent = (f: (e: LiveEvent) => void) => { eventSubs.add(f); return () => { eventSubs.delete(f) } }

/* ------------------------------ requests ------------------------------ */
type Ack = { t: 'ack'; rid: number; ok: boolean; msg?: string; code?: string; [k: string]: unknown }
const pending = new Map<number, { resolve: (a: Ack) => void; timer: number }>()
let rid = 1

function ready(): Promise<void> {
  if (state.online) return Promise.resolve()
  if (!getToken()) return Promise.reject(new Error('Sign in to play with friends.'))
  if (!ws) openSocket()
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => { subs.delete(check); reject(new Error('Cannot reach the NEXORA server. Check your connection and try again.')) }, 6000)
    const check = () => { if (state.online) { subs.delete(check); window.clearTimeout(t); resolve() } }
    subs.add(check)
  })
}

async function rpc(msg: Record<string, unknown>): Promise<Ack> {
  await ready()
  return new Promise((resolve, reject) => {
    const id = rid++
    const timer = window.setTimeout(() => { pending.delete(id); reject(new Error('The server did not answer. Try again.')) }, 7000)
    pending.set(id, {
      timer,
      resolve: (a) => { window.clearTimeout(timer); if (a.ok) resolve(a); else reject(new Error(a.msg ?? 'Something went wrong.')) },
    })
    ws?.send(JSON.stringify({ ...msg, rid: id }))
  })
}

/* ------------------------------- socket ------------------------------- */
function onMessage(ev: MessageEvent) {
  let m: Record<string, unknown>
  try { m = JSON.parse(String(ev.data)) } catch { return }
  switch (m.t) {
    case 'authed': retry = 0; set({ online: true, connecting: false }); break
    case 'authfail': dropToken(); break
    case 'ack': { const p = pending.get(m.rid as number); if (p) { pending.delete(m.rid as number); p.resolve(m as Ack) } break }
    case 'social': set({ friends: m.friends as Friend[], incoming: m.incoming as Person[], outgoing: m.outgoing as Person[] }); break
    case 'notice': emit({ kind: m.kind as 'request' | 'accepted', from: m.from as Person }); break
    case 'invite': {
      const invite: Invite = { id: ++inviteN, from: m.from as Person, code: m.code as string, arena: m.arena as ArenaId, mode: m.mode as string, at: Date.now() }
      // a newer invite from the same friend replaces the older one
      set({ invites: [...state.invites.filter((i) => i.from.uid !== invite.from.uid), invite] })
      emit({ kind: 'invite', invite })
      break
    }
    case 'invite-declined': emit({ kind: 'declined', from: m.from as Person }); break
    case 'room': {
      const room = { code: m.code, arena: m.arena, mode: m.mode, you: m.you, host: m.host, guest: m.guest } as LiveRoom
      // a rival who left shows up as a missing guest, so reset the flag once someone is in again
      set({ room, closed: false, rivalGone: room.guest ? false : state.rivalGone })
      break
    }
    case 'start': set({ start: { seed: m.seed as number, n: ++startN }, answers: {}, rivalGone: false }); break
    case 'answer': set({ answers: { ...state.answers, [m.idx as number]: m.res as RoundResult } }); break
    case 'left': set({ rivalGone: true }); break
    case 'closed': set({ closed: true, rivalGone: true, room: null }); break
  }
}

function openSocket() {
  if (ws || !getToken()) return
  set({ connecting: true })
  let sock: WebSocket
  try { sock = new WebSocket(wsUrl()) } catch { set({ connecting: false }); return }
  ws = sock
  sock.onopen = () => sock.send(JSON.stringify({ t: 'auth', token: getToken(), elo: getProfile().elo }))
  sock.onmessage = onMessage
  sock.onclose = () => {
    if (ws !== sock) return
    ws = null
    for (const [id, p] of pending) { window.clearTimeout(p.timer); p.resolve({ t: 'ack', rid: id, ok: false, msg: 'Lost connection to the NEXORA server.' }) }
    pending.clear()
    // a match in progress cannot continue without the connection
    set({ online: false, connecting: false, rivalGone: state.room ? true : state.rivalGone, invites: [] })
    if (getToken()) {
      window.clearTimeout(retryTimer)
      retryTimer = window.setTimeout(openSocket, Math.min(15000, 1000 * 2 ** retry++))
    }
  }
  sock.onerror = () => { /* onclose follows */ }
}

function closeSocket() {
  window.clearTimeout(retryTimer)
  const s = ws
  ws = null
  if (s) { try { s.close() } catch { /* ignore */ } }
  set({ ...initial })
}

/** keep the socket in step with who is signed in */
let lastToken: string | null = null
function sync() {
  const token = getAccount().token
  if (token === lastToken) return
  lastToken = token
  if (token) { retry = 0; openSocket() } else closeSocket()
}
subscribeAccount(sync)
sync()

/** page became visible again (phones suspend sockets in the background) */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && getToken() && !ws) { retry = 0; openSocket() } })
}

/* -------------------------------- rooms -------------------------------- */
export async function createRoom(arena: ArenaId, mode: string): Promise<LiveRoom> {
  set({ room: null, start: null, answers: {}, rivalGone: false, closed: false })
  await rpc({ t: 'create', arena, mode })
  return state.room as LiveRoom
}

export async function joinRoom(code: string): Promise<LiveRoom> {
  set({ room: null, start: null, answers: {}, rivalGone: false, closed: false })
  await rpc({ t: 'join', code })
  return state.room as LiveRoom
}

const out = (msg: unknown) => { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)) }
export const startMatch = () => out({ t: 'start' })
export const sendAnswer = (idx: number, res: RoundResult) => out({ t: 'answer', idx, res })

let handledStart = 0
/** the lobby calls this when it launches a start event, so coming back to it does not replay the same one */
export const takeStart = () => { const s = state.start; if (!s || s.n === handledStart) return null; handledStart = s.n; return s }

export function leaveRoom() {
  out({ t: 'leave' })
  set({ room: null, start: null, answers: {}, rivalGone: false, closed: false })
}

/* ------------------------------- friends ------------------------------- */
export async function searchPlayers(q: string): Promise<SearchHit[]> {
  const a = await rpc({ t: 'search', q })
  return a.results as SearchHit[]
}
export const sendFriendRequest = async (uid: string) => (await rpc({ t: 'fr-request', uid })) as Ack & { became?: boolean; name?: string }
export const acceptFriend = async (uid: string) => { await rpc({ t: 'fr-accept', uid }) }
export const declineFriend = async (uid: string) => { await rpc({ t: 'fr-decline', uid }) }
export const cancelRequest = async (uid: string) => { await rpc({ t: 'fr-cancel', uid }) }
export const removeFriend = async (uid: string) => { await rpc({ t: 'fr-remove', uid }) }
export async function inviteFriend(uid: string) { await rpc({ t: 'invite', uid }) }

export async function acceptInvite(inv: Invite): Promise<LiveRoom> {
  set({ invites: state.invites.filter((i) => i.id !== inv.id) })
  return joinRoom(inv.code)
}
export function declineInvite(inv: Invite) {
  set({ invites: state.invites.filter((i) => i.id !== inv.id) })
  out({ t: 'invite-decline', uid: inv.from.uid })
}
export const dismissInvite = (id: number) => set({ invites: state.invites.filter((i) => i.id !== id) })

/** a friend picked with "Challenge": the next room created invites them automatically */
let inviteTarget: Person | null = null
export const setInviteTarget = (p: Person | null) => { inviteTarget = p }
export const peekInviteTarget = () => inviteTarget
export const takeInviteTarget = () => { const t = inviteTarget; inviteTarget = null; return t }

export const sendElo = (elo: number) => out({ t: 'profile', elo })
