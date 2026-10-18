// Accounts, sessions and the friend graph. Stored in one JSON file (DATA_DIR/db.json).
// Passwords are hashed with scrypt and never stored in plain text. Session tokens are
// stored as SHA-256 hashes, so a leaked db file does not give anyone a working login.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'data')
const FILE = path.join(DATA_DIR, 'db.json')
const SESSION_TTL = 60 * 24 * 60 * 60 * 1000
const UID_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const RESERVED = new Set(['nexo', 'nexora', 'admin', 'administrator', 'support', 'system', 'moderator', 'staff', 'root', 'null', 'undefined'])

/** @type {{users: Record<string, any>, sessions: Record<string, {uid: string, exp: number}>}} */
let db = { users: {}, sessions: {} }
const byName = new Map()
const byEmail = new Map()

function load() {
  try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { db = { users: {}, sessions: {} } }
  db.users ??= {}; db.sessions ??= {}
  const now = Date.now()
  for (const [h, s] of Object.entries(db.sessions)) if (s.exp < now || !db.users[s.uid]) delete db.sessions[h]
  for (const u of Object.values(db.users)) { byName.set(u.username.toLowerCase(), u.uid); byEmail.set(u.email, u.uid) }
}
load()

let timer = null
export function save() {
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      const tmp = `${FILE}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(db))
      fs.renameSync(tmp, FILE)
    } catch (e) { console.error('Could not save accounts:', e.message) }
  }, 250)
}
export function flush() {
  if (timer) { clearTimeout(timer); timer = null }
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(`${FILE}.tmp`, JSON.stringify(db)); fs.renameSync(`${FILE}.tmp`, FILE) } catch { /* ignore */ }
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')
const makeUid = () => {
  for (let i = 0; i < 100; i++) {
    let s = ''
    for (let k = 0; k < 6; k++) s += UID_CHARS[crypto.randomInt(UID_CHARS.length)]
    const uid = `NXU-${s}`
    if (!db.users[uid]) return uid
  }
  throw new Error('uid space exhausted')
}
export const markOf = (name) => name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'P'
export const getUser = (uid) => db.users[uid] ?? null
export const publicUser = (u) => ({ uid: u.uid, username: u.username, mark: markOf(u.username) })

/** "nxu 7k2m9q", "NXU-7K2M9Q" and "7k2m9q" all mean the same UID */
export function normalizeUid(q) {
  const s = String(q ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const m = /^(?:NXU)?([A-Z0-9]{6})$/.exec(s)
  return m ? `NXU-${m[1]}` : null
}

async function hashPassword(password, salt) {
  return (await scrypt(password, Buffer.from(salt, 'hex'), 64)).toString('hex')
}

function newSession(uid) {
  const token = crypto.randomBytes(32).toString('hex')
  db.sessions[sha(token)] = { uid, exp: Date.now() + SESSION_TTL }
  save()
  return token
}

export const sessionUser = (token) => {
  if (typeof token !== 'string' || token.length !== 64) return null
  const s = db.sessions[sha(token)]
  if (!s || s.exp < Date.now()) return null
  return getUser(s.uid)
}
export const endSession = (token) => { if (typeof token === 'string') { delete db.sessions[sha(token)]; save() } }

export async function register({ username, email, password }) {
  username = String(username ?? '').trim()
  email = String(email ?? '').trim().toLowerCase()
  password = String(password ?? '')
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) return { error: 'Usernames are 3 to 16 letters, numbers or underscores.', field: 'username' }
  if (RESERVED.has(username.toLowerCase())) return { error: 'That username is reserved. Pick another.', field: 'username' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 100) return { error: 'Enter a valid email address.', field: 'email' }
  if (password.length < 8 || password.length > 128) return { error: 'Use a password with 8 to 128 characters.', field: 'password' }
  if (byName.has(username.toLowerCase())) return { error: 'That username is taken.', field: 'username' }
  if (byEmail.has(email)) return { error: 'An account with that email already exists. Try signing in.', field: 'email' }
  const salt = crypto.randomBytes(16).toString('hex')
  const user = {
    uid: makeUid(), username, email, salt, hash: await hashPassword(password, salt),
    createdAt: Date.now(), elo: 1000, friends: [], incoming: [], outgoing: [],
  }
  // another request may have registered the same name while we were hashing
  if (byName.has(username.toLowerCase()) || byEmail.has(email)) return { error: 'That username or email was just taken.', field: 'username' }
  db.users[user.uid] = user
  byName.set(username.toLowerCase(), user.uid); byEmail.set(email, user.uid)
  save()
  return { user, token: newSession(user.uid) }
}

export async function login({ id, password }) {
  id = String(id ?? '').trim().toLowerCase()
  password = String(password ?? '')
  const uid = byEmail.get(id) ?? byName.get(id) ?? (normalizeUid(id) && db.users[normalizeUid(id)] ? normalizeUid(id) : null)
  const user = uid ? db.users[uid] : null
  // always do the hash work so a missing account takes as long as a wrong password
  const salt = user ? user.salt : '00'.repeat(16)
  const hash = await hashPassword(password, salt)
  if (!user || !crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex'))) return { error: 'Wrong username, email or password.' }
  return { user, token: newSession(user.uid) }
}

/* ------------------------------- friends ------------------------------- */
const without = (arr, v) => arr.filter((x) => x !== v)

export function relation(me, other) {
  if (me.uid === other.uid) return 'self'
  if (me.friends.includes(other.uid)) return 'friend'
  if (me.incoming.includes(other.uid)) return 'incoming'
  if (me.outgoing.includes(other.uid)) return 'outgoing'
  return 'none'
}

export function search(me, q) {
  q = String(q ?? '').trim()
  if (q.length < 2) return []
  const out = []
  const seen = new Set()
  const add = (u) => { if (u && u.uid !== me.uid && !seen.has(u.uid)) { seen.add(u.uid); out.push({ ...publicUser(u), relation: relation(me, u) }) } }
  const uid = normalizeUid(q)
  if (uid) add(db.users[uid])
  const low = q.toLowerCase().replace(/^@/, '')
  const exact = byName.get(low)
  if (exact) add(db.users[exact])
  if (low.length >= 2) for (const [name, id] of byName) { if (out.length >= 8) break; if (name.startsWith(low)) add(db.users[id]) }
  return out.slice(0, 8)
}

/** returns {error} or {becameFriends, to} */
export function sendRequest(me, targetUid) {
  const t = getUser(targetUid)
  if (!t) return { error: 'No player with that ID.' }
  if (t.uid === me.uid) return { error: 'That is you.' }
  if (me.friends.includes(t.uid)) return { error: `You and ${t.username} are already friends.` }
  if (me.outgoing.includes(t.uid)) return { error: `You already sent ${t.username} a request.` }
  if (me.incoming.includes(t.uid)) return { ...accept(me, t.uid), becameFriends: true }
  if (me.outgoing.length >= 50) return { error: 'Too many pending requests. Cancel a few first.' }
  me.outgoing.push(t.uid); t.incoming.push(me.uid)
  save()
  return { to: t }
}

export function accept(me, uid) {
  const t = getUser(uid)
  if (!t || !me.incoming.includes(uid)) return { error: 'That request is no longer there.' }
  me.incoming = without(me.incoming, uid); t.outgoing = without(t.outgoing, me.uid)
  // if both sent a request at once, clean the mirror side too
  me.outgoing = without(me.outgoing, uid); t.incoming = without(t.incoming, me.uid)
  if (!me.friends.includes(uid)) me.friends.push(uid)
  if (!t.friends.includes(me.uid)) t.friends.push(me.uid)
  save()
  return { to: t }
}

export function decline(me, uid) {
  const t = getUser(uid)
  if (!t || !me.incoming.includes(uid)) return { error: 'That request is no longer there.' }
  me.incoming = without(me.incoming, uid); t.outgoing = without(t.outgoing, me.uid)
  save()
  return { to: t }
}

export function cancel(me, uid) {
  const t = getUser(uid)
  if (!t || !me.outgoing.includes(uid)) return { error: 'That request is no longer there.' }
  me.outgoing = without(me.outgoing, uid); t.incoming = without(t.incoming, me.uid)
  save()
  return { to: t }
}

export function unfriend(me, uid) {
  const t = getUser(uid)
  if (!t || !me.friends.includes(uid)) return { error: 'You are not friends.' }
  me.friends = without(me.friends, uid); t.friends = without(t.friends, me.uid)
  save()
  return { to: t }
}

export function setElo(user, elo) {
  const n = Math.max(0, Math.min(5000, Math.round(Number(elo) || 0)))
  if (n && n !== user.elo) { user.elo = n; save() }
}
