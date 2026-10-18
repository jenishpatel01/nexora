import { useEffect, useRef, useState } from 'react'
import { useApp } from '../app/context'
import { arenas, rankBands, nexo } from '../data/nexo'
import { Btn } from '../components/Btn'
import { Logo } from '../components/Logo'
import { Nexo } from '../components/Nexo'
import { WorldCard } from '../components/WorldCard'
import { RankBadge } from '../components/RankBadge'
import { Icon } from '../components/Icon'
import { Reveal } from '../motion/Reveal'
import { CountUp } from '../motion/CountUp'
import type { Mood } from '../types'
import { sfx } from '../motion/sound'
import { isBooted } from '../app/boot'

const words = ['THINK', 'FASTER.', 'OUTSMART', 'EVERYONE.']

function LandingNav() {
  const { go } = useApp()
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const on = () => setStuck(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <header className={`lnav ${stuck ? 'is-stuck' : ''}`}>
      <Logo go={go} />
      <nav aria-label="Sections" className="lnav-links">
        <button onClick={() => jump('worlds')}>Arenas</button>
        <button onClick={() => jump('how')}>How it works</button>
        <button onClick={() => jump('meet-nexo')}>Meet NEXO</button>
        <button onClick={() => jump('ranks')}>Ranks</button>
      </nav>
      <div className="lnav-cta">
        <button className="link-btn lnav-signin" onClick={() => go('login')}>Sign in</button>
        <Btn size="sm" variant="peach" icon="play" onClick={() => go('register')}>Play free</Btn>
      </div>
    </header>
  )
}

const lines: Record<Mood, string> = {
  idle: 'You ready for another round?',
  happy: 'That was fun. Again?',
  sad: 'Okay, okay. You got me.',
  think: 'Hmm. Let me think about that.',
  search: 'Looking for someone your size...',
  wink: 'I will go easy. Maybe.',
  cheer: 'Level up! I knew it!',
  smug: 'Was that your best?',
}

export function Landing() {
  const { go } = useApp()
  const [mood, setMood] = useState<Mood>('idle')
  const [heroMood, setHeroMood] = useState<Mood>('idle')
  const timer = useRef(0)
  const [late] = useState(isBooted)
  const react = (m: Mood) => { setMood(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setMood('idle'), 2600) }

  return (
    <div className={`landing ${late ? 'is-late' : ''}`}>
      <LandingNav />

      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-copy">
          <h1 id="hero-h" className="t-hero hero-title" aria-label="Think faster. Outsmart everyone.">
            {words.map((w, i) => (
              <span className="hw-mask" key={w} aria-hidden="true"><span className="hw" style={{ ['--i' as string]: i }}>{w}</span></span>
            ))}
          </h1>
          <p className="lead hero-lead">Five rounds. Six arenas. One ranking. Play coding, debate, roast, business, knowledge and mind games against NEXO, your friends and players worldwide.</p>
          <div className="hero-cta" onPointerEnter={() => setHeroMood('cheer')} onPointerLeave={() => setHeroMood('idle')}>
            <Btn size="lg" variant="peach" magnetic icon="play" onClick={() => go('register')}>Play now</Btn>
            <Btn size="lg" variant="ghost" icon="arrow" onClick={() => go('intro')}>See how it works</Btn>
          </div>
          <p className="hero-proof"><i className="live-dot" /><b className="count"><CountUp to={24842} duration={1600} delay={900} /></b> playing right now</p>
        </div>

        <div className="hero-stage" aria-hidden="false">
          <div className="hero-blob" />
          <Nexo mood={heroMood} size={330} speech={heroMood === 'cheer' ? 'Let us go!' : 'Beat me. I dare you.'} onPoke={() => sfx('click')} pokeMood="wink" />
          <div className="hero-chip hc-a"><Icon name="bolt" size={16} />Match found</div>
          <div className="hero-chip hc-b"><span className="hc-up">+24</span> ELO</div>
          <div className="hero-chip hc-c"><RankBadge elo={1286} size={22} />Gold II</div>
        </div>
      </section>

      <section id="worlds" className="l-section" aria-labelledby="worlds-h">
        <Reveal as="div" className="l-head">
          <h2 id="worlds-h" className="t-xl">Six arenas.<br />Pick your fight.</h2>
          <p className="lead">Every arena has its own look, its own rules and its own AI specialist waiting for you.</p>
        </Reveal>
        <div className="world-grid">
          {arenas.map((a, i) => (
            <Reveal key={a.id} variant="scale" delay={(i % 3) * 90}><WorldCard arena={a} onOpen={() => go(a.id)} /></Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="l-section how" aria-labelledby="how-h">
        <Reveal className="l-head"><h2 id="how-h" className="t-xl">Three minutes<br />from tap to result.</h2></Reveal>
        <ol className="how-steps">
          {[
            { n: 1, t: 'Find a rival', d: 'Search for a real opponent. If nobody shows up in time, NEXO steps in and plays.', ico: 'search' as const, tone: 'blue' },
            { n: 2, t: 'Play five rounds', d: 'Each round is a different test of your head. Faster and sharper answers score more.', ico: 'bolt' as const, tone: 'peach' },
            { n: 3, t: 'Climb the ranks', d: 'Win to gain ELO and XP. Unlock achievements and move from Bronze to Nexora Elite.', ico: 'trophy' as const, tone: 'mint' },
          ].map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 140} variant="rise" className={`how-step tone-${s.tone}`}>
              <span className="how-n">{s.n}</span>
              <span className="how-ico"><Icon name={s.ico} size={30} /></span>
              <h3 className="t-m">{s.t}</h3>
              <p>{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="meet-nexo" className="l-section meet" aria-labelledby="meet-h">
        <Reveal variant="left" className="meet-stage">
          <div className="meet-blob" />
          <Nexo mood={mood} size={300} speech={lines[mood]} onPoke={() => react('wink')} />
        </Reveal>
        <Reveal variant="right" className="meet-copy">
          <h2 id="meet-h" className="t-xl">Meet NEXO.<br />It is an AI.<br />It plays like one.</h2>
          <p className="lead">NEXO is your sparring partner. It learns how you play, adapts mid-match, and gets a little cocky when it is ahead. Poke it. See what happens.</p>
          <div className="mood-row" role="group" aria-label="Make NEXO react">
            {([['happy', 'Cheer it on'], ['think', 'Make it think'], ['sad', 'Beat it'], ['smug', 'Tease it']] as [Mood, string][]).map(([m, l]) => (
              <button key={m} className="chip-btn" onClick={() => { react(m); sfx(m === 'sad' ? 'defeat' : 'correct') }}>{l}</button>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="ranks" className="l-section ranks" aria-labelledby="ranks-h">
        <Reveal className="l-head"><h2 id="ranks-h" className="t-xl">Eight ranks.<br />One summit.</h2><p className="lead">Your ELO moves after every ranked match. Gold is saved for the very top.</p></Reveal>
        <div className="rank-ladder">
          {rankBands.map((b, i) => (
            <Reveal key={b.name} variant="rise" delay={i * 60} className="rank-step" style={{ ['--h' as string]: i }}>
              <RankBadge elo={b.from + 5} size={i > 4 ? 64 : 54} />
              <b>{b.name}</b>
              <small className="count">{b.from.toLocaleString()}{b.to > 9999 ? '+' : ''}</small>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="l-section final">
        <Reveal variant="scale" className="final-card">
          <Nexo mood="cheer" size={150} />
          <div>
            <h2 className="t-xl">Your first match is a few taps away.</h2>
            <p className="lead">No download. Free to play.</p>
          </div>
          <Btn size="lg" variant="peach" magnetic icon="play" onClick={() => go('register')}>Create account</Btn>
        </Reveal>
        <footer className="l-foot">
          <Logo />
          <span>Think faster. Outsmart everyone.</span>
          <span className="muted small">NEXO is an AI. Online counts and other players in this build are demo data.</span>
        </footer>
      </section>
    </div>
  )
}

export function ProductIntro() {
  const { go } = useApp()
  const [i, setI] = useState(0)
  const slides: { mood: Mood; title: string; body: string }[] = [
    { mood: 'wink', title: 'Hi, I am NEXO.', body: 'I am an AI, and I will be your sparring partner. Think of me as the friend who is slightly too good at everything.' },
    { mood: 'search', title: 'Six arenas, five rounds each.', body: 'Code, debate, roast, run a company, answer trivia or bend your mind. Every match is five short rounds.' },
    { mood: 'cheer', title: 'Win to climb.', body: 'Every ranked win moves your ELO and fills your XP bar. Hit Gold, then keep going.' },
  ]
  const s = slides[i]
  const last = i === slides.length - 1
  return (
    <div className="intro">
      <div className="intro-top"><Logo go={go} /><button className="link-btn" onClick={() => go('register')}>Skip</button></div>
      <div className="intro-body" key={i}>
        <Nexo mood={s.mood} size={260} />
        <h1 className="t-xl">{s.title}</h1>
        <p className="lead">{s.body}</p>
      </div>
      <div className="intro-foot">
        <div className="dots" role="tablist" aria-label="Intro steps">{slides.map((_, k) => <button key={k} role="tab" aria-selected={k === i} aria-label={`Step ${k + 1}`} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}</div>
        <Btn size="lg" variant={last ? 'peach' : 'primary'} icon={last ? 'play' : 'arrow'} onClick={() => (last ? go('register') : setI(i + 1))}>{last ? 'Create account' : 'Next'}</Btn>
      </div>
      <span className="sr-only">{nexo.name} is an AI companion.</span>
    </div>
  )
}
