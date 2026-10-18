import { useLayoutEffect, useRef } from 'react'

type Props<T extends string> = {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
  tone?: string
}

export function Segmented<T extends string>({ options, value, onChange, label, tone }: Props<T>) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const place = () => {
      const el = root.current?.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!el || !root.current) return
      root.current.style.setProperty('--x', `${el.offsetLeft - 5}px`)
      root.current.style.setProperty('--w', `${el.offsetWidth}px`)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [value, options.length])
  return (
    <div className="segmented" role="tablist" aria-label={label} ref={root} style={tone ? ({ ['--seg' as string]: tone }) : undefined}>
      <span className="thumb" aria-hidden="true" style={tone ? { background: tone } : undefined} />
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}
