import { rankInfo } from '../game/progression'

export function RankBadge({ elo, size = 56, showLabel = false, label }: { elo: number; size?: number; showLabel?: boolean; label?: string }) {
  const info = rankInfo(elo)
  const pips = info.division === 'III' ? 1 : info.division === 'II' ? 2 : info.division === 'I' ? 3 : 3
  const id = `rb-${info.band.replace(/\s/g, '')}`
  return (
    <span className="rank-badge" style={{ ['--rank' as string]: info.color }}>
      <svg width={size} height={size * 1.1} viewBox="0 0 64 70" role="img" aria-label={label ?? info.label}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={info.color} />
            <stop offset="1" stopColor={info.color} stopOpacity=".62" />
          </linearGradient>
        </defs>
        <path d="M32 3l25 9v20c0 17-11 28-25 35C18 60 7 49 7 32V12z" fill={`url(#${id})`} />
        <path d="M32 3l25 9v20c0 17-11 28-25 35z" fill="#fff" opacity=".18" />
        <path d="M32 11l17 6v14c0 11-7 19-17 24-10-5-17-13-17-24V17z" fill="#211A2E" opacity=".86" />
        <path d="M23 38V24h4l6 8V24h4v14h-4l-6-8v8z" fill={info.color} transform="translate(-1 0)" />
        {Array.from({ length: pips }).map((_, i) => (
          <circle key={i} cx={32 + (i - (pips - 1) / 2) * 7} cy="49" r="2" fill={info.color} />
        ))}
      </svg>
      {showLabel && <b>{label ?? info.label}</b>}
    </span>
  )
}
