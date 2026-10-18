export type IconName =
  | 'arrow' | 'play' | 'grid' | 'users' | 'trophy' | 'bell' | 'sliders' | 'back' | 'copy' | 'check' | 'clock' | 'plus' | 'search'
  | 'close' | 'menu' | 'flame' | 'star' | 'bolt' | 'code' | 'mic' | 'chart' | 'question' | 'shapes' | 'chat' | 'heart' | 'lock'
  | 'crown' | 'sound' | 'sound-off' | 'home' | 'user' | 'eye' | 'eye-off' | 'mail' | 'pause' | 'refresh' | 'swords' | 'lightbulb'

const paths: Record<IconName, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  play: 'M8 5.5v13l11-6.5z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  back: 'M15 18l-6-6 6-6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  check: 'M20 6L9 17l-5-5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  close: 'M18 6L6 18M6 6l12 12',
  menu: 'M4 7h16M4 12h16M4 17h16',
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-1.7.8-3 1.8-4 .2 1.2.9 2 1.7 2C10.2 8.5 11 5.5 12 3z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3',
  chart: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  question: 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 17.5v.01',
  shapes: 'M12 3l4.5 7.5h-9zM4 14h7v7H4zM17.5 17.5m-3.5 0a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0',
  chat: 'M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.4A8 8 0 1 1 21 12z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  lock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  sound: 'M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  'sound-off': 'M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'eye-off': 'M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.8M6.6 6.7A16.6 16.6 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2',
  mail: 'M4 5h16v14H4zM4 7l8 6 8-6',
  pause: 'M8 5v14M16 5v14',
  refresh: 'M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5',
  swords: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-4 4M3 19l2 2',
  lightbulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
}

const filled = new Set<IconName>(['play'])

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill={filled.has(name) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  )
}
