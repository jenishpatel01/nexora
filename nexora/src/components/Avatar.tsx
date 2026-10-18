const tints = ['#A78BFA', '#FFB38A', '#8ED8FF', '#8DE7C2', '#FF9FCB']

export function tintFor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return tints[h % tints.length]
}

export function Avatar({ name, size = 44, online, mark, className = '' }: { name: string; size?: number; online?: boolean; mark?: string; className?: string }) {
  const initials = mark ?? name.replace(/[^A-Za-z ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, background: tintFor(name), fontSize: size * 0.38 }} aria-hidden="true">
      {initials}
      {online !== undefined && <i className={`avatar-dot ${online ? 'on' : ''}`} />}
    </span>
  )
}
