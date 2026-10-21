// NEXORA server: accounts, friends, live rooms.
// One process serves the built site (./dist), a small JSON API at /api and a WebSocket at /ws.
//   npm run build && npm start        -> http://localhost:8787
// Accounts are saved to DATA_DIR/db.json (see accounts.mjs). Rooms live in memory.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomInt } from 'node:crypto'
import { WebSocketServer } from 'ws'
import * as acc from './accounts.mjs'
import { aiEnabled, generateRounds } from './ai.mjs'

const PORT = Number(process.env.PORT) || 8787
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const CORS_ORIGIN = process.env.CORS_ORIGIN || ''
const ARENAS = ['coding', 'debate', 'roast', 'business', 'knowledge', 'mind']
const MAX_ROOMS = 2000
const ROOM_TTL = 3 * 60 * 60 * 1000
const ROUNDS = 5

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.json': 'application/json', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
}

/* --------------------------------- http --------------------------------- */
const hits = new Map()
/** true when this key made more than `max` calls in the last `ms` */
function limited(key, max, ms) {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < ms)
  list.push(now); hits.set(key, list)
  return list.length > max
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 3600000)) hits.delete(k) }, 600000)

const ipOf = (req) => String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '').split(',')[0].trim()
const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
const readBody = (req, max = 4096) => new Promise((resolve, reject) => {
  let size = 0; const chunks = []
  req.on('data', (c) => { size += c.length; if (size > max) { reject(new Error('too large')); req.destroy() } else chunks.push(c) })
  req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')) } catch { reject(new Error('bad json')) } })
  req.on('error', reject)
})
const me = (u) => ({ uid: u.uid, username: u.username, mark: acc.markOf(u.username), elo: u.elo })
const bearer = (req) => String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')

async function api(req, res, pathname) {
  if (CORS_ORIGIN) {
    res.setHeader('access-control-allow-origin', CORS_ORIGIN)
    res.setHeader('access-control-allow-headers', 'content-type, authorization')
    res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS')
    res.setHeader('vary', 'origin')
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  }
  const ip = ipOf(req)
  try {
    if (req.method === 'POST' && pathname === '/api/register') {
      if (limited(`reg:${ip}`, 10, 3600000)) return json(res, 429, { error: 'Too many sign-ups from this network. Try again later.' })
      const r = await acc.register(await readBody(req))
      if (r.error) return json(res, 400, { error: r.error, field: r.field })
      return json(res, 200, { token: r.token, me: me(r.user) })
    }
    if (req.method === 'POST' && pathname === '/api/login') {
      if (limited(`login:${ip}`, 20, 600000)) return json(res, 429, { error: 'Too many attempts. Wait a few minutes and try again.' })
      const r = await acc.login(await readBody(req))
      if (r.error) return json(res, 401, { error: r.error })
      return json(res, 200, { token: r.token, me: me(r.user) })
    }
    if (req.method === 'GET' && pathname === '/api/me') {
      const u = acc.sessionUser(bearer(req))
      return u ? json(res, 200, { me: me(u) }) : json(res, 401, { error: 'Signed out.' })
    }
    if (req.method === 'POST' && pathname === '/api/rounds') {
      if (limited(`rounds:${ip}`, 40, 600000)) return json(res, 429, { error: 'Slow down.' })
      const b = await readBody(req, 16384)
      const arena = String(b.arena ?? '')
      if (!ARENAS.includes(arena)) return json(res, 400, { error: 'Unknown arena.' })
      // empty list means "use the built-in questions"
      return json(res, 200, { items: (await generateRounds(arena, b.avoid)) ?? [] })
    }
    if (req.method === 'POST' && pathname === '/api/logout') { acc.endSession(bearer(req)); return json(res, 200, { ok: true }) }
    return json(res, 404, { error: 'Not found.' })
  } catch (e) {
    return json(res, e.message === 'too large' ? 413 : 400, { error: 'Bad request.' })
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  if (url.pathname.startsWith('/api/')) { api(req, res, url.pathname); return }
  if (url.pathname === '/health') { json(res, 200, { ok: true, rooms: rooms.size, online: online.size, ai: aiEnabled }); return }
  let file = path.join(DIST, decodeURIComponent(url.pathname))
  if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Build the site first: npm run build'); return }
    const headers = { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' }
    if (file.includes(`${path.sep}assets${path.sep}`)) headers['cache-control'] = 'public, max-age=31536000, immutable'
    res.writeHead(200, headers); res.end(buf)
  })
})

/* ------------------------------ presence + push ------------------------------ */
/** @type {Map<string, Set<any>>} */
const online = new Map()
const isOnline = (uid) => (online.get(uid)?.size ?? 0) > 0
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)) }
const pushUser = (uid, msg) => { for (const ws of online.get(uid) ?? []) send(ws, msg) }

const friendView = (u) => ({ ...acc.publicUser(u), elo: u.elo, online: isOnline(u.uid) })
function socialFor(u) {
  const list = (ids, f) => ids.map((id) => acc.getUser(id)).filter(Boolean).map(f)
  return { t: 'social', friends: list(u.friends, friendView), incoming: list(u.incoming, acc.publicUser), outgoing: list(u.outgoing, acc.publicUser) }
}
const pushSocial = (uid) => { const u = acc.getUser(uid); if (u) pushUser(uid, socialFor(u)) }
const notice = (uid, kind, from) => pushUser(uid, { t: 'notice', kind, from: acc.publicUser(from) })

function setOnline(user, ws) {
  const set = online.get(user.uid) ?? new Set()
  const was = set.size > 0
  set.add(ws); online.set(user.uid, set)
  if (!was) for (const f of user.friends) pushSocial(f)
}
function setOffline(user, ws) {
  const set = online.get(user.uid)
  if (!set) return
  set.delete(ws)
  if (set.size === 0) { online.delete(user.uid); for (const f of user.friends) pushSocial(f) }
}

/* --------------------------------- rooms --------------------------------- */
/** @type {Map<string, {code:string, arena:string, mode:string, host:any, guest:any, started:boolean, created:number}>} */
const rooms = new Map()
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n)
const info = (ws) => ({ uid: ws.user.uid, name: ws.user.username, mark: acc.markOf(ws.user.username), elo: ws.user.elo })
const makeCode = () => { for (let i = 0; i < 50; i++) { const c = `NX-${randomInt(10000, 100000)}`; if (!rooms.has(c)) return c } return null }

const view = (room, role) => ({ t: 'room', code: room.code, arena: room.arena, mode: room.mode, you: role, started: room.started, host: room.host.info, guest: room.guest ? room.guest.info : null })
const broadcast = (room) => { send(room.host.ws, view(room, 'host')); if (room.guest) send(room.guest.ws, view(room, 'guest')) }
const other = (room, ws) => (room.host.ws === ws ? room.guest : room.host)

function leave(ws) {
  const room = ws.room
  if (!room) return
  ws.room = null
  if (room.host.ws === ws) {
    if (room.guest) { send(room.guest.ws, { t: 'closed' }); room.guest.ws.room = null }
    rooms.delete(room.code)
  } else if (room.guest && room.guest.ws === ws) {
    room.guest = null
    room.started = false
    send(room.host.ws, { t: 'left' })
    broadcast(room)
  }
}

/* ---------------------------------- ws ---------------------------------- */
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 })

wss.on('connection', (ws) => {
  ws.alive = true
  ws.room = null
  ws.user = null
  ws.hits = []
  ws.on('pong', () => { ws.alive = true })

  ws.on('message', async (raw) => {
    const now = Date.now()
    ws.hits = ws.hits.filter((t) => now - t < 2000)
    if (ws.hits.push(now) > 30) return
    let m
    try { m = JSON.parse(String(raw)) } catch { return }
    if (!m || typeof m.t !== 'string') return
    const reply = (ok, extra = {}) => { if (m.rid !== undefined) send(ws, { t: 'ack', rid: m.rid, ok, ...extra }) }
    const fail = (msg, code) => { reply(false, { msg, code }) }

    if (m.t === 'auth') {
      const u = acc.sessionUser(m.token)
      if (!u) { send(ws, { t: 'authfail' }); return }
      if (ws.user) return
      ws.user = u
      acc.setElo(u, m.elo)
      send(ws, { t: 'authed', me: me(u) })
      send(ws, socialFor(u))
      setOnline(u, ws)
      return
    }
    if (!ws.user) return fail('Sign in to play with friends.', 'auth')
    const u = ws.user

    switch (m.t) {
      case 'profile': acc.setElo(u, m.elo); return
      case 'search': return reply(true, { results: acc.search(u, m.q) })

      case 'fr-request': {
        if (limited(`fr:${u.uid}`, 20, 600000)) return fail('Slow down. Try again in a few minutes.')
        const r = acc.sendRequest(u, String(m.uid ?? ''))
        if (r.error) return fail(r.error)
        pushSocial(u.uid); pushSocial(r.to.uid)
        if (r.becameFriends) { notice(r.to.uid, 'accepted', u); return reply(true, { became: true, name: r.to.username }) }
        notice(r.to.uid, 'request', u)
        return reply(true, { name: r.to.username })
      }
      case 'fr-accept': {
        const r = acc.accept(u, String(m.uid ?? ''))
        if (r.error) return fail(r.error)
        pushSocial(u.uid); pushSocial(r.to.uid); notice(r.to.uid, 'accepted', u)
        return reply(true, { name: r.to.username })
      }
      case 'fr-decline': case 'fr-cancel': case 'fr-remove': {
        const fn = m.t === 'fr-decline' ? acc.decline : m.t === 'fr-cancel' ? acc.cancel : acc.unfriend
        const r = fn(u, String(m.uid ?? ''))
        if (r.error) return fail(r.error)
        pushSocial(u.uid); pushSocial(r.to.uid)
        return reply(true)
      }

      case 'create': {
        if (ws.room) leave(ws)
        if (rooms.size >= MAX_ROOMS) return fail('The server is full. Try again in a minute.')
        const code = makeCode()
        if (!code) return fail('Could not make a room code. Try again.')
        const arena = ARENAS.includes(m.arena) ? m.arena : 'mind'
        const room = { code, arena, mode: clean(m.mode, 24) || 'Standard', host: { ws, info: info(ws) }, guest: null, started: false, created: now }
        rooms.set(code, room); ws.room = room
        broadcast(room)
        return reply(true)
      }
      case 'join': {
        if (ws.room) leave(ws)
        const room = rooms.get(clean(m.code, 8).toUpperCase())
        if (!room) return fail('No room with that code. Check it and try again.', 'no-room')
        if (room.host.ws === ws) return fail('That is your own room.')
        if (room.host.info.uid === u.uid) return fail('That is your own room.')
        if (room.guest) return fail('That room is full.', 'full')
        if (room.started) return fail('That match already started.', 'started')
        room.guest = { ws, info: info(ws) }; ws.room = room
        broadcast(room)
        return reply(true)
      }
      case 'invite': {
        const room = ws.room
        if (!room || room.host.ws !== ws) return fail('Create a room first.')
        if (room.guest) return fail('Your room already has an opponent.')
        const target = String(m.uid ?? '')
        if (!u.friends.includes(target)) return fail('You can only invite friends.')
        const t = acc.getUser(target)
        if (!t || !isOnline(target)) return fail(`${t ? t.username : 'That player'} is offline right now.`)
        if (limited(`inv:${u.uid}`, 15, 600000)) return fail('Too many invites. Wait a moment.')
        pushUser(target, { t: 'invite', from: acc.publicUser(u), code: room.code, arena: room.arena, mode: room.mode })
        return reply(true, { name: t.username })
      }
      case 'invite-decline': {
        const host = acc.getUser(String(m.uid ?? ''))
        if (host && host.friends.includes(u.uid)) pushUser(host.uid, { t: 'invite-declined', from: acc.publicUser(u) })
        return
      }
    }

    const room = ws.room
    if (!room) return

    if (m.t === 'start') {
      if (room.host.ws !== ws || !room.guest) return
      if (room.starting) return
      room.started = true; room.starting = true
      // both players get the same fresh questions; without AI they build the same ones from the seed
      const items = await generateRounds(room.arena)
      room.starting = false
      const msg = { t: 'start', seed: randomInt(1, 2 ** 31 - 1), arena: room.arena, mode: room.mode, items: items ?? undefined }
      if (room.host.ws) send(room.host.ws, msg)
      if (room.guest) send(room.guest.ws, msg)
      return
    }

    if (m.t === 'answer') {
      const idx = Number(m.idx)
      if (!Number.isInteger(idx) || idx < 0 || idx >= ROUNDS || !m.res || typeof m.res !== 'object') return
      const r = m.res
      const res = {
        choice: Number.isInteger(r.choice) ? r.choice : undefined,
        correct: typeof r.correct === 'boolean' ? r.correct : undefined,
        ms: Math.max(0, Math.min(120000, Number(r.ms) || 0)),
        count: Number.isInteger(r.count) ? r.count : undefined,
        falseStart: r.falseStart === true ? true : undefined,
        timedOut: r.timedOut === true ? true : undefined,
        points: Math.max(0, Math.min(400, Math.round(Number(r.points) || 0))),
      }
      const peer = other(room, ws)
      if (peer) send(peer.ws, { t: 'answer', idx, res })
      return
    }

    if (m.t === 'leave') { leave(ws); return }
  })

  const drop = () => { leave(ws); if (ws.user) { setOffline(ws.user, ws); ws.user = null } }
  ws.on('close', drop)
  ws.on('error', drop)
})

// drop dead sockets and abandoned rooms
setInterval(() => {
  const now = Date.now()
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue }
    ws.alive = false; ws.ping()
  }
  for (const [code, room] of rooms) if (now - room.created > ROOM_TTL) { room.host.ws.close(); room.guest?.ws.close(); rooms.delete(code) }
}, 25000)

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { acc.flush().finally(() => process.exit(0)) })

server.listen(PORT, '0.0.0.0', () => console.log(`NEXORA server on http://localhost:${PORT}  (api /api, ws /ws)`))
