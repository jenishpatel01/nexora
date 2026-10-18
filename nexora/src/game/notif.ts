import { useSyncExternalStore } from 'react'

export type Notif = { id: string; kind: 'invite' | 'friend' | 'rank' | 'nexo' | 'event'; title: string; note: string; age: string; unread: boolean; at?: number }
let items: Notif[] = []
const subs = new Set<() => void>()
const emit = () => subs.forEach((s) => s())
export const useNotifs = () => useSyncExternalStore((fn) => { subs.add(fn); return () => { subs.delete(fn) } }, () => items, () => items)
export const markAllRead = () => { items = items.map((n) => ({ ...n, unread: false })); emit() }
export const markRead = (id: string) => { items = items.map((n) => (n.id === id ? { ...n, unread: false } : n)); emit() }
export const dismiss = (id: string) => { items = items.filter((n) => n.id !== id); emit() }
let seq = 0
export const addNotif = (n: Pick<Notif, 'kind' | 'title' | 'note'>) => { items = [{ ...n, id: `live-${++seq}`, age: 'now', unread: true, at: Date.now() }, ...items].slice(0, 30); emit() }
