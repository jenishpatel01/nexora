import { useSyncExternalStore } from 'react'
import { apiBase } from './config'

export type Me = { uid: string; username: string; mark: string; elo: number }
type State = { token: string | null; me: Me | null; ready: boolean }
export type AuthResult = { ok: true; me: Me } | { ok: false; error: string; field?: string; offline?: boolean }

const KEY = 'nexora:account:v1'
const read = (): string | null => {
  try { return localStorage.getItem(KEY) || sessionStorage.getItem(KEY) } catch { return null }
}

let state: State = { token: read(), me: null, ready: !read() }
const subs = new Set<() => void>()
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach((f) => f()) }

export const getAccount = () => state
export const getToken = () => state.token
export const subscribeAccount = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
export const useAccount = () => useSyncExternalStore(subscribeAccount, getAccount, getAccount)

function store(token: string | null, remember = true) {
  try {
    localStorage.removeItem(KEY); sessionStorage.removeItem(KEY)
    if (token) (remember ? localStorage : sessionStorage).setItem(KEY, token)
  } catch { /* storage unavailable: the session lasts until the tab closes */ }
}

async function call(path: string, body?: unknown, token?: string | null) {
  const res = await fetch(`${apiBase()}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data: Record<string, unknown> = {}
  try { data = await res.json() } catch { /* not json: the server is not NEXORA's */ }
  return { status: res.status, data }
}

async function authenticate(path: string, body: unknown, remember: boolean): Promise<AuthResult> {
  try {
    const { status, data } = await call(path, body)
    if (status === 200 && data.token && data.me) {
      store(data.token as string, remember)
      set({ token: data.token as string, me: data.me as Me, ready: true })
      return { ok: true, me: data.me as Me }
    }
    // no JSON error from NEXORA's server means nothing is answering /api (a dev proxy with no server behind it, a static host)
    if (!data.error) return { ok: false, offline: true, error: 'Cannot reach the NEXORA server. Run npm run dev (or npm start) so the server is running, or continue offline.' }
    return { ok: false, error: String(data.error), field: data.field as string | undefined }
  } catch {
    return { ok: false, offline: true, error: 'Cannot reach the NEXORA server. Check your connection, or continue offline.' }
  }
}

export const registerAccount = (username: string, email: string, password: string, remember = true) => authenticate('/api/register', { username, email, password }, remember)
export const loginAccount = (id: string, password: string, remember = true) => authenticate('/api/login', { id, password }, remember)

export async function logout() {
  const token = state.token
  store(null)
  set({ token: null, me: null, ready: true })
  if (token) { try { await call('/api/logout', {}, token) } catch { /* already signed out locally */ } }
}

/** on page load: turn a saved token into an account, or drop it if the server no longer knows it */
export async function restoreAccount() {
  const token = state.token
  if (!token) { set({ ready: true }); return }
  try {
    const { status, data } = await call('/api/me', undefined, token)
    if (status === 200 && data.me) set({ me: data.me as Me, ready: true })
    else if (status === 401) { store(null); set({ token: null, me: null, ready: true }) }
    else set({ ready: true })
  } catch { set({ ready: true }) }
}

/** the socket found out the token is no longer valid */
export function dropToken() { store(null); set({ token: null, me: null, ready: true }) }
