import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { todayKey } from '../app/flow'
import { arenaById } from '../data/nexo'
import { useProfile, getProfile, setProfile } from '../game/store'
import { aiPlay, buildRounds, comboMultiplier, finishMatch, scoreRound } from '../game/engine'
import type { PickRound, QuizRound, ReactionRound, Round, RoundLog, RoundResult, SequenceRound } from '../game/types'
import { ArenaScene } from '../components/ArenaScene'
import { Avatar } from '../components/Avatar'
import { Btn } from '../components/Btn'
import { Icon } from '../components/Icon'
import { Nexo } from '../components/Nexo'
import { CountUp } from '../motion/CountUp'
import { motionReduced } from '../motion/hooks'
import { sfx } from '../motion/sound'
import type { Mood } from '../types'
import { leaveRoom, sendAnswer, useLive } from '../net/live'

type Phase = 'intro' | 'play' | 'wait' | 'reveal'
type Res = Omit<RoundResult, 'points'>
const LETTERS = ['A', 'B', 'C', 'D']

/* ------------------------------ quiz ------------------------------ */
function Quiz({ round, onDone, rivalChoice, revealed, mine }: { round: QuizRound; onDone: (r: Res) => void; rivalChoice?: number; revealed: boolean; mine?: number }) {
  const t0 = useRef(performance.now())
  const pick = useCallback((i: number) => {
    if (revealed) return
    onDone({ choice: i, correct: i === round.answer, ms: performance.now() - t0.current })
  }, [onDone, revealed, round.answer])

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const i = LETTERS.findIndex((l) => l.toLowerCase() === e.key.toLowerCase())
      const n = Number(e.key) - 1
      const idx = i >= 0 ? i : n >= 0 && n < round.options.length ? n : -1
      if (idx >= 0 && idx < round.options.length) pick(idx)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [pick, round.options.length])

  return (
    <div className="q">
      {round.category && <span className="chip lav">{round.category}</span>}
      <h2 className="q-prompt">{round.prompt}</h2>
      {round.code && <pre className="q-code" tabIndex={0} aria-label="Code"><code>{round.code}</code></pre>}
      <div className="q-opts" role="group" aria-label="Answers">
        {round.options.map((o, i) => {
          const state = !revealed ? '' : i === round.answer ? 'is-right' : i === mine ? 'is-wrong' : 'is-dim'
          return (
            <button key={i} className={`q-opt ${state} ${mine === i ? 'is-mine' : ''}`} disabled={revealed} onClick={() => pick(i)} data-cursor="game">
              <span className="q-key">{LETTERS[i]}</span>
              <span className="q-text">{o}</span>
              {revealed && rivalChoice === i && <span className="q-rival">Rival</span>}
              {revealed && i === round.answer && <i className="q-tick"><Icon name="check" size={16} /></i>}
            </button>
          )
        })}
      </div>
      {revealed && <p className="q-why" role="status"><Icon name="lightbulb" size={18} />{round.why}</p>}
    </div>
  )
}

/* ------------------------------ pick ------------------------------ */
function Pick({ round, arena, onDone, rivalChoice, revealed, mine }: { round: PickRound; arena: string; onDone: (r: Res) => void; rivalChoice?: number; revealed: boolean; mine?: number }) {
  const t0 = useRef(performance.now())
  const best = Math.max(...round.options.map((o) => o.value))
  return (
    <div className="q pk">
      <p className="pk-ctx">{round.context}</p>
      {round.quote && <blockquote className="pk-quote"><span>{arena === 'roast' ? 'They said' : 'Opponent'}</span>{round.quote}</blockquote>}
      <h2 className="q-prompt">{round.prompt}</h2>
      <div className="pk-opts" role="group" aria-label="Your options">
        {round.options.map((o, i) => {
          const chosen = mine === i
          const state = !revealed ? '' : o.value === best ? 'is-right' : chosen ? 'is-wrong' : 'is-dim'
          return (
            <button key={o.id} className={`pk-opt ${state} ${chosen ? 'is-mine' : ''}`} disabled={revealed} data-cursor="game" onClick={() => onDone({ choice: i, ms: performance.now() - t0.current })}>
              <span className="q-key">{LETTERS[i]}</span>
              <span className="pk-body">
                <span className="q-text">{o.text}</span>
                {revealed && (
                  <span className="pk-reveal">
                    {o.tag && <span className="chip">{o.tag}</span>}
                    <span className="pk-meter" aria-label={`Strength ${o.value} of 10`}><i style={{ width: `${o.value * 10}%` }} /></span>
                    {o.note && <small>{o.note}</small>}
                    {typeof o.share === 'number' && <small className="pk-num">Market share {o.share >= 0 ? '+' : ''}{o.share}% · Trust {typeof o.trust === 'number' && o.trust >= 0 ? '+' : ''}{o.trust}</small>}
                  </span>
                )}
              </span>
              {revealed && rivalChoice === i && <span className="q-rival">Rival</span>}
              {revealed && chosen && <span className="q-you">You</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------------------- sequence ---------------------------- */
function Sequence({ round, onDone }: { round: SequenceRound; onDone: (r: Res) => void }) {
  const [stage, setStage] = useState<'show' | 'input'>('show')
  const [lit, setLit] = useState<number | null>(null)
  const [flash, setFlash] = useState<{ i: number; ok: boolean } | null>(null)
  const [entered, setEntered] = useState(0)
  const t0 = useRef(0)
  const finished = useRef(false)
  const fast = motionReduced()

  useEffect(() => {
    const timers: number[] = []
    const gap = fast ? 420 : 780
    round.steps.forEach((s, k) => {
      timers.push(window.setTimeout(() => { setLit(s); sfx('tick') }, 700 + k * gap))
      timers.push(window.setTimeout(() => setLit(null), 700 + k * gap + gap * 0.6))
    })
    timers.push(window.setTimeout(() => { setStage('input'); t0.current = performance.now() }, 700 + round.steps.length * gap + 200))
    return () => timers.forEach(window.clearTimeout)
  }, [round, fast])

  useEffect(() => {
    if (stage !== 'input') return
    const t = window.setTimeout(() => { if (!finished.current) { finished.current = true; onDone({ count: entered, ms: round.time * 1000, timedOut: true }) } }, round.time * 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const tap = (i: number) => {
    if (stage !== 'input' || finished.current) return
    const ok = i === round.steps[entered]
    setFlash({ i, ok })
    window.setTimeout(() => setFlash(null), 320)
    sfx(ok ? 'correct' : 'wrong')
    const next = ok ? entered + 1 : entered
    setEntered(next)
    if (!ok || next === round.length) {
      finished.current = true
      window.setTimeout(() => onDone({ count: next, ms: performance.now() - t0.current }), 380)
    }
  }

  return (
    <div className="q sq">
      <h2 className="q-prompt">{stage === 'show' ? 'Watch the pattern' : 'Now repeat it'}</h2>
      <p className="muted sq-count" aria-live="polite">{stage === 'show' ? `${round.length} steps` : `${entered} of ${round.length}`}</p>
      <div className="sq-grid" role="group" aria-label="Pattern grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <button key={i} aria-label={`Tile ${i + 1}`} disabled={stage !== 'input'} data-cursor="game"
            className={`sq-tile ${lit === i ? 'is-lit' : ''} ${flash?.i === i ? (flash.ok ? 'is-ok' : 'is-bad') : ''}`} onClick={() => tap(i)} />
        ))}
      </div>
      {stage === 'input' && <div className="tm" aria-hidden="true"><i style={{ animationDuration: `${round.time}s` }} /></div>}
    </div>
  )
}

/* ---------------------------- reaction ---------------------------- */
function Reaction({ round, onDone }: { round: ReactionRound; onDone: (r: Res) => void }) {
  const [state, setState] = useState<'wait' | 'go' | 'early'>('wait')
  const t0 = useRef(0)
  const finished = useRef(false)
  useEffect(() => {
    const a = window.setTimeout(() => { setState('go'); t0.current = performance.now(); sfx('go') }, round.delay)
    return () => window.clearTimeout(a)
  }, [round.delay])
  useEffect(() => {
    if (state !== 'go') return
    const t = window.setTimeout(() => { if (!finished.current) { finished.current = true; onDone({ ms: round.time * 1000, timedOut: true }) } }, round.time * 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])
  const hit = () => {
    if (finished.current) return
    finished.current = true
    if (state === 'wait') { setState('early'); window.setTimeout(() => onDone({ ms: 0, falseStart: true }), 650); return }
    onDone({ ms: Math.round(performance.now() - t0.current) })
  }
  return (
    <div className="q rx">
      <h2 className="q-prompt">{state === 'early' ? 'Too early!' : state === 'go' ? 'Tap now!' : 'Wait for green'}</h2>
      <button className={`rx-pad rx-${state}`} onPointerDown={hit} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hit() } }} data-cursor="game" aria-label="Reaction pad. Tap when it turns green.">
        <span>{state === 'wait' ? 'Wait...' : state === 'go' ? 'TAP!' : 'Oops'}</span>
      </button>
      <p className="muted small">Tap the pad (or press space) the moment it turns green. Tapping early scores zero.</p>
    </div>
  )
}

/* ------------------------------ match ------------------------------ */
export function ActiveMatch() {
  const { go, session, setOutcome, setLogs } = useApp()
  const arena = arenaById(session.arena)
  const opp = session.opponent
  const profile = useProfile()
  const start = useRef(Date.now())
  const startProfile = useRef(getProfile())
  const liveSeed = session.live?.seed
  const live = liveSeed !== undefined
  const ls = useLive()
  const rounds = useMemo(() => buildRounds(session.arena, liveSeed), [session.arena, liveSeed])
  const [mine, setMine] = useState<RoundResult | null>(null)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  const [logs, setLocal] = useState<RoundLog[]>([])
  const [pending, setPending] = useState<{ p: RoundResult; r: RoundResult } | null>(null)
  const [leave, setLeave] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const rivalRef = useRef<RoundResult | null>(null)
  const settled = useRef(false)

  const round: Round = rounds[idx]
  const playerStreak = (() => { let s = 0; for (let i = logs.length - 1; i >= 0; i--) { if (logs[i].player.correct) s++; else break } return s })()
  const rivalStreak = (() => { let s = 0; for (let i = logs.length - 1; i >= 0; i--) { if (logs[i].rival.correct) s++; else break } return s })()
  const combo = comboMultiplier(session.arena, playerStreak)
  const pScore = logs.reduce((s, l) => s + l.player.points, 0)
  const rScore = logs.reduce((s, l) => s + l.rival.points, 0)

  // round intro
  useEffect(() => {
    if (phase !== 'intro') return
    settled.current = false
    if (!live) rivalRef.current = aiPlay(round, opp.skill, rivalStreak, session.arena)
    const t = window.setTimeout(() => setPhase('play'), motionReduced() ? 300 : 1100)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx])

  const submit = useCallback((res: Res) => {
    if (settled.current) return
    settled.current = true
    let points = scoreRound(round, res, combo)
    if (res.timedOut && round.kind === 'reaction') points = 0
    const player: RoundResult = { ...res, points }
    if (live) { setMine(player); sendAnswer(idx, player); setPhase('wait'); return }
    const rival = rivalRef.current!
    setPending({ p: player, r: rival })
    setPhase('reveal')
    const good = round.kind === 'pick' ? points >= 60 : points > 0
    sfx(good ? 'correct' : 'wrong')
  }, [round, combo, live, idx])

  // live: reveal once both players have answered this round
  const rivalNow = live ? ls.answers[idx] : undefined
  useEffect(() => {
    if (!live || phase !== 'wait' || !mine || !rivalNow) return
    setPending({ p: mine, r: rivalNow })
    setPhase('reveal')
    const good = round.kind === 'pick' ? mine.points >= 60 : mine.points > 0
    sfx(good ? 'correct' : 'wrong')
  }, [live, phase, mine, rivalNow, round.kind])
  const gone = live && ls.rivalGone && !rivalNow && phase !== 'reveal' && phase !== 'intro'

  // timer for quiz / pick
  useEffect(() => {
    if (phase !== 'play' || (round.kind !== 'quiz' && round.kind !== 'pick')) return
    const t = window.setTimeout(() => submit(round.kind === 'quiz' ? { correct: false, ms: round.time * 1000, timedOut: true } : { ms: round.time * 1000, timedOut: true }), round.time * 1000)
    return () => window.clearTimeout(t)
  }, [phase, round, submit])

  const next = () => {
    if (!pending) return
    const entry: RoundLog = { round, player: pending.p, rival: pending.r }
    const all = [...logs, entry]
    setLocal(all)
    setPending(null)
    setMine(null)
    if (idx + 1 < rounds.length) { setIdx(idx + 1); setPhase('intro'); return }
    setFinishing(true)
    const outcome = finishMatch(startProfile.current, { arena: session.arena, opponent: opp, ranked: session.ranked, logs: all, durationSec: Math.round((Date.now() - start.current) / 1000) })
    if (session.kind === 'daily') setProfile({ ...getProfile(), dailyDone: todayKey() })
    setOutcome(outcome)
    setLogs(all)
    window.setTimeout(() => go('result', { replace: true }), 350)
  }

  useEffect(() => {
    if (phase !== 'reveal') return
    const on = (e: KeyboardEvent) => { if (e.key === 'Enter') next() }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  const lead = pScore - rScore
  const nexoMood: Mood = phase === 'reveal' && pending ? (pending.r.points > pending.p.points ? 'smug' : pending.r.points < pending.p.points ? 'sad' : 'happy') : phase === 'play' ? 'think' : 'idle'
  const stage = round.stage ?? arena.roundNames[idx]
  const lastRound = idx === rounds.length - 1

  return (
    <div className={`mt ap-${session.arena}`} style={{ ['--accent' as string]: `var(--${session.arena})` }} data-phase={phase}>
      <div className="ap-backdrop" aria-hidden="true"><ArenaScene id={session.arena} /><span className="ap-shade strong" /></div>
      <header className="mt-bar">
        <div className="mt-side mt-me">
          <Avatar name={profile.name} size={48} />
          <span><small>{profile.name}</small><b className="display count"><CountUp to={pScore} duration={700} /></b></span>
        </div>
        <div className="mt-mid">
          <span className="mt-arena">{arena.name} · {session.mode}</span>
          <ol className="mt-pips" aria-label={`Round ${idx + 1} of ${rounds.length}`}>
            {rounds.map((_, i) => {
              const l = logs[i]
              const st = l ? (l.player.points > l.rival.points ? 'w' : l.player.points < l.rival.points ? 'l' : 'd') : i === idx ? 'now' : ''
              return <li key={i} className={st} />
            })}
          </ol>
          <span className={`mt-lead ${lead > 0 ? 'up' : lead < 0 ? 'down' : ''}`}>{lead === 0 ? 'Tied' : lead > 0 ? `You lead by ${lead}` : `${opp.name} leads by ${-lead}`}</span>
        </div>
        <div className="mt-side mt-rival">
          <span><small>{opp.name}</small><b className="display count"><CountUp to={rScore} duration={700} /></b></span>
          {opp.id === 'nexo' ? <Nexo mood={nexoMood} size={56} interactive={false} track={false} float={false} /> : <Avatar name={opp.name} mark={opp.mark} size={48} />}
        </div>
      </header>

      <main className="mt-stage" id="match-stage">
        {phase === 'intro' ? (
          <div className="mt-intro" key={`i${idx}`} role="status">
            <small>Round {idx + 1} of {rounds.length}</small>
            <h1 className="t-xl">{stage}</h1>
            {combo > 1 && <span className="chip peach">Streak bonus x{combo}</span>}
          </div>
        ) : (
          <div className="mt-card panel dark" key={`r${idx}`}>
            <div className="mt-card-top">
              <span className="chip" style={{ color: 'var(--accent)' }}>Round {idx + 1} · {stage}</span>
              {combo > 1 && phase === 'play' && <span className="chip peach">Streak bonus x{combo}</span>}
              {(round.kind === 'quiz' || round.kind === 'pick') && phase === 'play' && <span className="tm" aria-hidden="true"><i style={{ animationDuration: `${round.time}s` }} /></span>}
            </div>
            {round.kind === 'quiz' && <Quiz round={round} onDone={submit} revealed={phase === 'reveal'} mine={pending?.p.choice ?? mine?.choice} rivalChoice={pending?.r.choice} />}
            {round.kind === 'pick' && <Pick round={round} arena={session.arena} onDone={submit} revealed={phase === 'reveal'} mine={pending?.p.choice ?? mine?.choice} rivalChoice={pending?.r.choice} />}
            {round.kind === 'sequence' && phase === 'play' && <Sequence round={round} onDone={submit} />}
            {round.kind === 'reaction' && phase === 'play' && <Reaction round={round} onDone={submit} />}
            {phase === 'wait' && !gone && <p className="mt-wait" role="status"><span className="mt-wait-dots" aria-hidden="true"><i /><i /><i /></span>Waiting for {opp.name} to answer</p>}
            {phase === 'reveal' && (round.kind === 'sequence' || round.kind === 'reaction') && pending && (
              <div className="q rv-mind">
                {round.kind === 'sequence'
                  ? <><h2 className="q-prompt">{pending.p.count === round.length ? 'Perfect recall' : `You got ${pending.p.count} of ${round.length}`}</h2><p className="muted">{opp.name} got {pending.r.count} of {round.length}.</p></>
                  : <><h2 className="q-prompt">{pending.p.falseStart ? 'False start' : pending.p.timedOut ? 'Too slow' : `${pending.p.ms} ms`}</h2><p className="muted">{opp.name} reacted in {Math.round(pending.r.ms)} ms{pending.r.falseStart ? ' (false start)' : ''}.</p></>}
              </div>
            )}

            {phase === 'reveal' && pending && (
              <div className="rv" role="status" aria-live="polite">
                <div className="rv-pts">
                  <div className={`rv-p ${pending.p.points >= pending.r.points ? 'is-win' : ''}`}><small>You</small><b className="display">+<CountUp to={pending.p.points} duration={650} /></b></div>
                  <div className={`rv-p ${pending.r.points > pending.p.points ? 'is-win' : ''}`}><small>{opp.name}</small><b className="display">+<CountUp to={pending.r.points} duration={650} delay={150} /></b></div>
                </div>
                <Btn variant="peach" busy={finishing} onClick={next}>{lastRound ? 'See result' : 'Next round'}</Btn>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-foot">
        <button className="link-btn small" onClick={() => { if (!leave) { setLeave(true); return } if (live) { leaveRoom(); go('hub') } else go(arena.id) }} onBlur={() => setLeave(false)}>{leave ? 'Leave without scoring? Click again' : 'Leave match'}</button>
      </footer>
      {gone && (
        <div className="mt-gone" role="alertdialog" aria-labelledby="gone-t">
          <div className="panel dark mt-gone-card">
            <Nexo mood="sad" size={110} />
            <h2 className="t-l" id="gone-t">{opp.name} left the match</h2>
            <p className="muted">The match can't finish without them, so it won't be scored.</p>
            <Btn variant="peach" onClick={() => { leaveRoom(); go('hub') }}>Back to hub</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
