import { type CSSProperties, type ElementType, type ReactNode } from 'react'
import { useInView, motionReduced } from './hooks'

type Props = {
  children: ReactNode
  as?: ElementType
  variant?: 'rise' | 'scale' | 'mask' | 'left' | 'right' | 'fade'
  delay?: number
  className?: string
  style?: CSSProperties
}

/** Scroll-triggered reveal. Use on major sections only. */
export function Reveal({ children, as: Tag = 'div', variant = 'rise', delay = 0, className = '', style }: Props) {
  const [ref, seen] = useInView<HTMLElement>()
  const reduced = motionReduced()
  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant} ${seen || reduced ? 'is-in' : ''} ${className}`}
      style={{ '--delay': `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
