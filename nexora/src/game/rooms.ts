import type { ArenaId } from '../types'

export type Room = { code: string; role: 'host' | 'guest'; arena: ArenaId; mode: string; friend: string; friendMark: string; friendElo: number }

let room: Room | null = null
export const getRoom = () => room
export const setRoom = (r: Room | null) => { room = r }
export const makeCode = () => `NX-${Math.floor(10000 + Math.random() * 90000)}`
export const validCode = (c: string) => /^NX-\d{5}$/i.test(c.trim())
