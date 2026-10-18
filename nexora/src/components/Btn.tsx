import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { registerMagnet } from '../motion/magnet'
import { sfx, type Cue } from '../motion/sound'

type Props = {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'peach' | 'ghost' | 'cream' | 'mint' | 'blue' | 'pink'
  size?: 'md' | 'sm' | 'lg'
  icon?: IconName | null
  disabled?: boolean
  type?: 'button' | 'submit'
  magnetic?: boolean
  cue?: Cue
  className?: string
  ariaLabel?: string
  busy?: boolean
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', icon = 'arrow', disabled, type = 'button', magnetic, cue = 'confirm', className = '', ariaLabel, busy }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!magnetic || !ref.current) return
    return registerMagnet(ref.current)
  }, [magnetic])
  return (
    <button
      ref={ref} type={type} disabled={disabled || busy} aria-label={ariaLabel} aria-busy={busy || undefined}
      data-magnetic={magnetic ? '' : undefined}
      className={`btn btn-${variant} btn-${size} ${busy ? 'is-busy' : ''} ${className}`}
      onClick={() => { sfx(cue); onClick?.() }}
    >
      <span className="btn-label">{children}</span>
      {busy ? <i className="btn-spin" aria-hidden="true" /> : icon && <span className="btn-chip"><Icon name={icon} size={size === 'sm' ? 14 : 16} /></span>}
    </button>
  )
}
