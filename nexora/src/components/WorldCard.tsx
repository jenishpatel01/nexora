import type { Arena } from '../types'
import { opponentById } from '../data/nexo'
import { ArenaScene } from './ArenaScene'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { TiltCard } from '../motion/TiltCard'
import { sfx } from '../motion/sound'

type Props = {
  arena: Arena
  onOpen: () => void
  rating?: number
  delta?: number
  compact?: boolean
}

export function Pips({ level, label }: { level: number; label: string }) {
  return (
    <span className="pips" role="img" aria-label={`Difficulty: ${label}`}>
      {[1, 2, 3, 4].map((i) => <i key={i} className={i <= level ? 'on' : ''} />)}
      <em>{label}</em>
    </span>
  )
}

export function WorldCard({ arena, onOpen, rating, delta, compact }: Props) {
  const ai = opponentById(arena.ai)
  return (
    <div className={`wc-cell ${arena.id}`}>
      <TiltCard
        as="button" className={`world-card wc-${arena.id} ${compact ? 'is-compact' : ''}`} data-cursor="card"
        onClick={onOpen} onPointerEnter={() => sfx('hover')} aria-label={`${arena.name}. ${arena.tagline} Your rating ${rating ?? arena.rating}.`}
      >
        <span className="wc-art"><ArenaScene id={arena.id} /></span>
        <span className="wc-shade" />
        <span className="wc-top">
          <span className="wc-live"><i className="live-dot" />{arena.live} playing</span>
        </span>
        <span className="wc-body">
          <span className="wc-title">{arena.name}</span>
          <span className="wc-tag">{arena.tagline}</span>
          {!compact && <span className="wc-blurb">{arena.blurb}</span>}
          <span className="wc-meta">
            <Pips level={arena.difficultyLevel} label={arena.difficulty} />
            <span className="wc-ai"><Avatar name={ai.name} mark={ai.mark} size={22} />{ai.name}</span>
            <span className="wc-rating"><b className="count">{rating ?? arena.rating}</b>{typeof delta === 'number' && <em className={delta >= 0 ? 'up' : 'down'}>{delta >= 0 ? '+' : ''}{delta}</em>}</span>
          </span>
          <span className="wc-cta">Enter world<Icon name="arrow" size={16} /></span>
        </span>
      </TiltCard>
    </div>
  )
}

export function MiniWorld({ arena, onOpen, index }: { arena: Arena; onOpen: () => void; index: number }) {
  return (
    <button className={`mini-world mw-${arena.id}`} style={{ ['--i' as string]: index }} onClick={onOpen} data-cursor="card" aria-label={`Open ${arena.name}`}>
      <span className="mw-art"><ArenaScene id={arena.id} /></span>
      <span className="mw-shade" />
      <b>{arena.name}</b>
    </button>
  )
}
