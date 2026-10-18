import { useSyncExternalStore } from 'react'

export type Settings = { sound: boolean; motion: boolean; contrast: boolean; invites: boolean }

const KEY = 'nexora:settings:v2'
const defaults: Settings = { sound: false, motion: true, contrast: false, invites: true }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaults
}

let state = load()
const listeners = new Set<() => void>()

export function applySettings() {
  const root = document.documentElement
  root.dataset.motion = state.motion ? 'full' : 'reduced'
  root.dataset.contrast = state.contrast ? 'high' : 'normal'
}

export const getSettings = () => state
export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  applySettings()
  listeners.forEach((l) => l())
}
export const useSettings = () => useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn) } }, getSettings, getSettings)
