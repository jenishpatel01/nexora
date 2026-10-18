import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ArenaId } from '../types'
import { motionReduced } from '../motion/hooks'
import { Icon } from './Icon'

const v = (o: Record<string, string | number>) => o as CSSProperties

function Ticker({ base, step, every = 900, prefix = '' }: { base: number; step: number; every?: number; prefix?: string }) {
  const [n, setN] = useState(base)
  useEffect(() => {
    if (motionReduced()) return
    const t = window.setInterval(() => setN((x) => (x > base + step * 14 ? base : x + step * (1 + Math.floor(Math.random() * 3)))), every)
    return () => window.clearInterval(t)
  }, [base, step, every])
  return <>{prefix}{n.toLocaleString()}</>
}

const codeLines: ReactNode[] = [
  <><b className="k">fn</b> <b className="f">race</b>(input) {'{'}</>,
  <>&nbsp;&nbsp;<b className="k">const</b> pace = <b className="f">optimize</b>(input)</>,
  <>&nbsp;&nbsp;<b className="k">if</b> (pace &gt; <b className="n">0.8</b>) <b className="k">return</b> pace</>,
  <>&nbsp;&nbsp;<b className="k">return</b> <b className="s">"zero"</b></>,
  <>{'}'}<i className="cd-caret" /></>,
]

function Coding() {
  return (
    <>
      <div className="cd-grid" />
      <div className="cd-win">
        <div className="cd-bar">
          <i /><i /><i />
          <span>match.ts</span>
          <b className="cd-status"><em className="s-run"><u />compiling</em><em className="s-ok">all tests pass</em></b>
        </div>
        <div className="cd-code">
          {codeLines.map((l, i) => <p key={i} style={v({ '--r': i })}><span>{l}</span></p>)}
        </div>
        <div className="cd-progress"><i /></div>
      </div>
      <div className="cd-tests">
        {['test 01', 'test 02', 'test 03'].map((t, i) => <p key={t} style={v({ '--r': i })}><Icon name="check" size={12} />{t}</p>)}
      </div>
      <div className="cd-chip"><Icon name="bolt" size={12} />12 ms</div>
    </>
  )
}

function Debate() {
  return (
    <>
      <div className="db-beam b1" /><div className="db-beam b2" />
      <div className="db-card c1"><i /><i /><i /></div>
      <div className="db-card c2"><i /><i /><i /></div>
      <div className="db-person p1"><span className="head" /><span className="body" /></div>
      <div className="db-person p2"><span className="head" /><span className="body" /></div>
      <div className="db-pod pod1"><b>You</b></div>
      <div className="db-pod pod2"><b>Vex</b></div>
      <svg className="db-timer" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" /><circle className="arc" cx="20" cy="20" r="16" pathLength="100" /></svg>
      <div className="db-score"><b>62</b><b>58</b></div>
      <div className="db-crowd">{Array.from({ length: 11 }).map((_, i) => <i key={i} style={v({ '--i': i })} />)}</div>
      <span className="db-react r1">+1</span><span className="db-react r2">★</span><span className="db-react r3">+1</span>
    </>
  )
}

function Roast() {
  return (
    <>
      <div className="rs-beam b1" /><div className="rs-beam b2" /><div className="rs-beam b3" />
      <div className="rs-sign">MIC<br />DROP</div>
      <div className="rs-mic"><span className="head" /><span className="rod" /></div>
      <div className="rs-base" />
      <span className="rs-bubble r1">HA!</span>
      <span className="rs-bubble r2">OOOH</span>
      <span className="rs-bubble r3"><Icon name="flame" size={14} /></span>
      <span className="rs-bubble r4">+120</span>
      <div className="rs-heat"><i /><Icon name="flame" size={11} /></div>
      <div className="rs-floor" />
      <div className="rs-crowd">{Array.from({ length: 9 }).map((_, i) => <i key={i} style={v({ '--i': i })} />)}</div>
    </>
  )
}

const buildings = [
  { l: 0, w: 11, h: 30 }, { l: 10, w: 9, h: 42 }, { l: 18, w: 12, h: 26 }, { l: 29, w: 8, h: 36 },
  { l: 36, w: 13, h: 22 }, { l: 49, w: 9, h: 40 }, { l: 57, w: 12, h: 28 }, { l: 68, w: 10, h: 44 },
  { l: 77, w: 11, h: 24 }, { l: 87, w: 13, h: 34 },
]

function Business() {
  return (
    <>
      <div className="bz-sky" /><div className="bz-dusk" />
      <div className="bz-city">
        {buildings.map((b, bi) => {
          const cols = Math.max(2, Math.floor(b.w / 3))
          const rows = Math.max(3, Math.floor(b.h / 4.2))
          return (
            <div className="bld" key={bi} style={v({ left: `${b.l}cqw`, width: `${b.w}cqw`, height: `${b.h}cqw`, '--cols': cols })}>
              {Array.from({ length: cols * rows }).map((_, wi) => <i key={wi} style={v({ '--d': `${((wi * 37 + bi * 53) % 70) / 10}s` })} />)}
            </div>
          )
        })}
      </div>
      <div className="bz-chart">
        <svg viewBox="0 0 120 56" preserveAspectRatio="none">
          <path className="area" d="M0 50 L14 42 L26 46 L42 30 L58 34 L74 16 L90 22 L120 4 L120 56 L0 56z" />
          <polyline className="line" pathLength="100" points="0,50 14,42 26,46 42,30 58,34 74,16 90,22 120,4" />
        </svg>
        <b><Icon name="chart" size={11} />+12.4%</b>
        <u className="dot" />
      </div>
      <div className="bz-bars"><i /><i /><i /><i /><i /></div>
      <div className="bz-profit"><small>profit</small><b>$<Ticker base={84210} step={137} every={700} /></b></div>
    </>
  )
}

function Knowledge() {
  return (
    <>
      <div className="kn-rays" />
      <div className="kn-card"><span className="q">?</span><p><i /><i /></p></div>
      <div className="kn-answers">
        {['A', 'B', 'C', 'D'].map((l, i) => <span key={l} className={i === 1 ? 'right' : ''} style={v({ '--i': i })}><b>{l}</b><i /></span>)}
      </div>
      <svg className="kn-timer" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" /><circle className="arc" cx="20" cy="20" r="16" pathLength="100" /></svg>
      <div className="kn-score"><small>score</small><b><Ticker base={1250} step={50} every={1100} /></b></div>
      <div className="kn-combo">x3 combo</div>
      <div className="kn-confetti">{Array.from({ length: 10 }).map((_, i) => <i key={i} style={v({ '--i': i })} />)}</div>
    </>
  )
}

function Mind() {
  const glyphs = ['●', '◆', '▲', '■', '◆', '●']
  return (
    <>
      <div className="mn-geo"><i /><i /><i /><b className="tri" /><b className="dot" /></div>
      <div className="mn-cards">
        {glyphs.map((g, i) => (
          <div className="mn-card" key={i} style={v({ '--i': i })}>
            <span className="back">?</span><span className="front">{g}</span>
          </div>
        ))}
      </div>
      <div className="mn-seq"><span>●</span><span>◆</span><span>▲</span><span className="q">?</span></div>
      <div className="mn-react"><i /></div>
    </>
  )
}

export function ArenaScene({ id }: { id: ArenaId }) {
  return (
    <div className={`scene scene-${id}`} aria-hidden="true">
      <div className="scene-stage">
        {id === 'coding' && <Coding />}
        {id === 'debate' && <Debate />}
        {id === 'roast' && <Roast />}
        {id === 'business' && <Business />}
        {id === 'knowledge' && <Knowledge />}
        {id === 'mind' && <Mind />}
      </div>
    </div>
  )
}
