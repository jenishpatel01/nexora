import type { Go } from '../types'

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="19" fill="#A78BFA" />
      <path d="M0 45 45 0h19v14L14 64H0z" fill="#FFB38A" opacity=".5" />
      <path d="M18 46V18h7.5L39 36V18h7v28h-7.5L25 28v18z" fill="#211A2E" />
    </svg>
  )
}

export function Logo({ go, onDark = true }: { go?: Go; onDark?: boolean }) {
  const inner = (
    <>
      <LogoMark />
      <span className="logo-word">NEXORA</span>
    </>
  )
  if (!go) return <span className={`logo ${onDark ? '' : 'on-light'}`}>{inner}</span>
  return <button className={`logo ${onDark ? '' : 'on-light'}`} onClick={() => go('landing')} aria-label="NEXORA home">{inner}</button>
}
