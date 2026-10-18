import { useEffect, useId, useRef, useState } from 'react'
import type { Mood } from '../types'
import { sfx } from '../motion/sound'

type Props = {
  mood?: Mood
  size?: number
  speech?: string
  float?: boolean
  track?: boolean
  className?: string
  onPoke?: () => void
  /** what the click reaction should look like */
  pokeMood?: Mood
  interactive?: boolean
}

/** NEXO, the NEXORA AI companion. Always marked with an AI badge on its chest. */
export function Nexo({ mood = 'idle', size = 200, speech, float = true, track = true, className = '', onPoke, pokeMood = 'wink', interactive = true }: Props) {
  const uid = useId().replace(/:/g, '')
  const root = useRef<SVGSVGElement>(null)
  const [poke, setPoke] = useState<Mood | null>(null)
  const [hover, setHover] = useState(false)
  const current = poke ?? mood

  useEffect(() => {
    if (!track || !root.current) return
    const svg = root.current
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = svg.getBoundingClientRect()
        const dx = (e.clientX - (r.left + r.width / 2)) / 360
        const dy = (e.clientY - (r.top + r.height * 0.42)) / 300
        svg.style.setProperty('--ex', Math.max(-1, Math.min(1, dx)).toFixed(3))
        svg.style.setProperty('--ey', Math.max(-1, Math.min(1, dy)).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame) }
  }, [track])

  const handlePoke = () => {
    if (!interactive) return
    sfx('click')
    setPoke(pokeMood)
    onPoke?.()
    window.setTimeout(() => setPoke(null), 1000)
  }

  return (
    <div className={`nexo-wrap ${className}`} style={{ width: size }}>
      {speech && <div className="nexo-speech" role="status"><span>{speech}</span></div>}
      <svg
        ref={root} className={`nexo ${float ? 'is-floating' : ''} ${poke ? 'is-poked' : ''} ${hover ? 'is-hover' : ''}`}
        data-mood={current} viewBox="0 0 200 224" width={size} height={size * 1.12}
        role="img" aria-label="NEXO, the NEXORA AI companion"
        onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} onClick={handlePoke}
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      >
        <defs>
          <linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#C4B2FF" />
            <stop offset="1" stopColor="#8B6CF0" />
          </linearGradient>
          <clipPath id={`${uid}c`}><rect x="38" y="44" width="124" height="134" rx="52" /></clipPath>
        </defs>
        <ellipse className="nexo-shadow" cx="100" cy="212" rx="50" ry="7" fill="#000" opacity=".22" />
        <g className="nexo-float">
          <g className="nexo-breathe">
            <g className="nexo-hand nexo-hand-l"><circle cx="26" cy="152" r="13" fill="#FFF8F1" /><circle cx="26" cy="152" r="13" fill="none" stroke="#211A2E" strokeOpacity=".18" strokeWidth="2" /></g>
            <g className="nexo-hand nexo-hand-r"><circle cx="174" cy="152" r="13" fill="#FFF8F1" /><circle cx="174" cy="152" r="13" fill="none" stroke="#211A2E" strokeOpacity=".18" strokeWidth="2" /></g>
            <rect x="26" y="92" width="18" height="40" rx="9" fill="#FFB38A" />
            <rect x="156" y="92" width="18" height="40" rx="9" fill="#FFB38A" />
            <g className="nexo-tuft"><polygon points="90,48 95,27 102,37 108,14 112,38 120,29 116,48" fill="#FFB38A" /></g>
            <rect x="38" y="44" width="124" height="134" rx="52" fill={`url(#${uid}b)`} />
            <g clipPath={`url(#${uid}c)`}>
              <polygon points="110,38 148,38 168,58 168,98" fill="#FFB38A" opacity=".9" />
              <ellipse cx="68" cy="62" rx="24" ry="10" fill="#fff" opacity=".28" transform="rotate(-24 68 62)" />
            </g>
            <rect x="54" y="72" width="92" height="66" rx="30" fill="#211A2E" />
            <rect x="54.5" y="72.5" width="91" height="65" rx="29.5" fill="none" stroke="#fff" strokeOpacity=".08" />
            <g className="nexo-eyes">
              <g className="eye-set eye-open">
                <rect className="eye" x="72.5" y="88" width="15" height="27" rx="7.5" fill="#8DE7C2" />
                <rect className="eye" x="112.5" y="88" width="15" height="27" rx="7.5" fill="#8DE7C2" />
                <circle cx="78" cy="96" r="3" fill="#fff" opacity=".9" />
                <circle cx="118" cy="96" r="3" fill="#fff" opacity=".9" />
              </g>
              <g className="eye-set eye-arc" fill="none" stroke="#8DE7C2" strokeWidth="5.5" strokeLinecap="round">
                <path d="M72 108q8-15 16 0" />
                <path d="M112 108q8-15 16 0" />
              </g>
              <g className="eye-set eye-wink" fill="none" stroke="#8DE7C2" strokeWidth="5.5" strokeLinecap="round">
                <path d="M112 108q8-15 16 0" />
              </g>
              <g className="eye-set eye-sad" fill="none" stroke="#8DE7C2" strokeWidth="5" strokeLinecap="round">
                <path d="M70 95l20-8M130 95l-20-8" />
              </g>
              <rect className="lid lid-l" x="70" y="85" width="20" height="14" rx="3" fill="#211A2E" />
              <rect className="lid lid-r" x="110" y="85" width="20" height="14" rx="3" fill="#211A2E" />
            </g>
            <g className="mouth" fill="none" stroke="#8DE7C2" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
              <path className="m-idle" d="M91 124q9 8 18 0" />
              <path className="m-happy" d="M88 122q12 13 24 0" />
              <path className="m-cheer" d="M87 121q13 19 26 0z" fill="#8DE7C2" />
              <path className="m-sad" d="M92 131q8-7 16 0" />
              <path className="m-think" d="M95 127h10" />
              <path className="m-smug" d="M90 126q10 4 20-3" />
              <circle className="m-search" cx="100" cy="127" r="3.5" />
            </g>
            <ellipse cx="62" cy="154" rx="9" ry="6" fill="#FF9FCB" opacity=".8" />
            <ellipse cx="138" cy="154" rx="9" ry="6" fill="#FF9FCB" opacity=".8" />
            <rect x="82" y="148" width="36" height="18" rx="9" fill="#FFF8F1" />
            <text x="100" y="161" textAnchor="middle" fontSize="11" fontWeight="800" fill="#211A2E" fontFamily="'Bricolage Grotesque Variable', sans-serif">AI</text>
            <path className="fx-sweat" d="M152 76q7 10 0 15-7-5 0-15z" fill="#8ED8FF" />
            <g className="fx-think" fill="#FFF8F1">
              <circle cx="150" cy="54" r="2.6" /><circle cx="160" cy="43" r="3.6" /><circle cx="173" cy="30" r="5.2" />
            </g>
            <g className="fx-spark" fill="#FFF8F1">
              <path className="sp s1" d="M20 70 22 76 28 78 22 80 20 86 18 80 12 78 18 76z" />
              <path className="sp s2" d="M180 64 182 70 188 72 182 74 180 80 178 74 172 72 178 70z" />
              <path className="sp s3" d="M176 20 177.5 24 182 25.5 177.5 27 176 31 174.5 27 170 25.5 174.5 24z" fill="#FFB38A" />
              <path className="sp s4" d="M26 30 27.5 34 32 35.5 27.5 37 26 41 24.5 37 20 35.5 24.5 34z" fill="#8DE7C2" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
