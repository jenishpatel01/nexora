import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { arenas, leaderSeed } from '../data/nexo'
import { useProfile } from '../game/store'
import { rankInfo } from '../game/progression'
import type { ArenaId } from '../types'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { RankBadge } from '../components/RankBadge'
import { Segmented } from '../components/Segmented'
import { CountUp } from '../motion/CountUp'
import { motionReduced } from '../motion/hooks'

type Scope = 'global' | 'friends'
type Board = ArenaId | 'all'

type Row = { id: string; name: string; elo: number; win: number; streak: number; move: number; country: string; friend?: boolean; you?: boolean }

export function Leaderboard() {
  const { go } = useApp()
  const p = useProfile()
  const [scope, setScope] = useState<Scope>('global')
  const [board, setBoard] = useState<Board>('all')
  const list = useRef<HTMLOListElement>(null)
  const prev = useRef<Map<string, number>>(new Map())

  const rows: Row[] = useMemo(() => {
    const total = p.wins + p.losses + p.draws
    const me: Row = { id: 'you', name: p.name, elo: board === 'all' ? p.elo : p.arena[board].elo, win: total ? Math.round((p.wins / total) * 100) : 0, streak: p.streak, move: 0, country: 'IN', you: true }
    const others: Row[] = leaderSeed.map((e) => ({ id: e.id, name: e.name, elo: board === 'all' ? e.base : e.arena[board], win: e.win, streak: e.streak, move: e.move, country: e.country, friend: e.friend }))
    const all = [...others, me].filter((r) => (scope === 'friends' ? r.friend || r.you : true))
    return all.sort((a, b) => b.elo - a.elo)
  }, [p, scope, board])

  // FLIP: animate rows to their new positions when the board changes
  useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    const next = new Map<string, number>()
    el.querySelectorAll<HTMLElement>('[data-id]').forEach((li) => {
      const id = li.dataset.id!
      const top = li.getBoundingClientRect().top
      next.set(id, top)
      const was = prev.current.get(id)
      if (was !== undefined && Math.abs(was - top) > 1 && !motionReduced()) {
        li.animate([{ transform: `translateY(${was - top}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)' })
      }
    })
    prev.current = next
  }, [rows])

  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)
  const myIdx = rows.findIndex((r) => r.you)
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="page lb stagger">
      <div className="page-head">
        <div><h1 className="t-xl">Rankings</h1><p className="lead">You are #{myIdx + 1} {board === 'all' ? 'overall' : `in ${arenas.find((a) => a.id === board)!.name}`}. Other players in this build are sample data.</p></div>
        <Segmented label="Scope" value={scope} onChange={setScope} options={[{ value: 'global', label: 'Global' }, { value: 'friends', label: 'Friends' }]} />
      </div>
      <div className="lb-filter">
        <Segmented label="Arena" value={board} onChange={setBoard} options={[{ value: 'all', label: 'All arenas' }, ...arenas.map((a) => ({ value: a.id as Board, label: a.name }))]} />
      </div>

      {top3.length >= 3 && (
        <div className="podium" role="list" aria-label="Top three">
          {podium.map((r) => {
            const place = rows.indexOf(r) + 1
            return (
              <div key={r.id} role="listitem" className={`pod pod-${place}`}>
                {place === 1 && <Icon name="crown" size={34} className="pod-crown" />}
                <Avatar name={r.name} size={place === 1 ? 92 : 72} />
                <b className="display pod-name">{r.name}{r.you ? ' (you)' : ''}</b>
                <span className="pod-elo count"><CountUp to={r.elo} duration={900} /></span>
                <span className="pod-base"><b>{place}</b></span>
              </div>
            )
          })}
        </div>
      )}

      <ol className="lb-list" ref={list}>
        {rest.map((r, i) => {
          const place = i + 4
          const rk = rankInfo(r.elo)
          return (
            <li key={r.id} data-id={r.id} className={`lb-row ${r.you ? 'is-you' : ''}`}>
              <span className="lb-n count">{place}</span>
              <Avatar name={r.name} size={44} />
              <span className="lb-name"><b className="display">{r.name}{r.you ? ' (you)' : ''}</b><small>{r.country}{r.friend ? ' · Friend' : ''}</small></span>
              <span className="lb-rank"><RankBadge elo={r.elo} size={22} />{rk.label}</span>
              <span className="lb-win count">{r.win}%</span>
              <span className="lb-str"><Icon name="flame" size={14} />{r.streak}</span>
              <span className={`lb-move ${r.move > 0 ? 'up' : r.move < 0 ? 'down' : ''}`}>{r.move > 0 ? `▲ ${r.move}` : r.move < 0 ? `▼ ${-r.move}` : '–'}</span>
              <b className="lb-elo display count">{r.elo.toLocaleString()}</b>
            </li>
          )
        })}
      </ol>
      <div className="lb-links"><button className="link-btn" onClick={() => go('achievements')}>Achievements</button><button className="link-btn" onClick={() => go('history')}>Match history</button></div>
    </div>
  )
}
