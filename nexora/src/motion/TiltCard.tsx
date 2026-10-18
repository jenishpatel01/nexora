import { useRef, type CSSProperties, type ElementType, type ReactNode, type PointerEvent } from 'react'
import { motionReduced } from './hooks'

type Props = {
  as?: ElementType
  children: ReactNode
  className?: string
  max?: number
  style?: CSSProperties
  [key: string]: unknown
}

/** Physical card feel: subtle perspective tilt and a light that follows the pointer. */
export function TiltCard({ as: Tag = 'div', children, className = '', max = 4, style, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null)
  const move = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current
    if (!el || e.pointerType === 'touch' || motionReduced()) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`)
    el.style.setProperty('--lx', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--ly', `${(y * 100).toFixed(1)}%`)
  }
  const leave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }
  return (
    <Tag ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave} style={style} {...rest}>
      {children}
    </Tag>
  )
}
