const env = (import.meta.env.VITE_WS_URL as string | undefined)?.trim()

/** WebSocket address of the NEXORA server. Same host by default, or VITE_WS_URL when the site is hosted elsewhere. */
export const wsUrl = () => env || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`

/** base for /api calls ('' means same origin) */
export const apiBase = () => (env ? env.replace(/^ws/, 'http').replace(/\/ws\/?$/, '') : '')
