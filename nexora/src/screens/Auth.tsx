import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useApp } from '../app/context'
import { arenas } from '../data/nexo'
import { adoptAccount, getProfile, setProfile } from '../game/store'
import { loginAccount, registerAccount, useAccount } from '../net/account'
import { Btn } from '../components/Btn'
import { Logo } from '../components/Logo'
import { Nexo } from '../components/Nexo'
import { Icon } from '../components/Icon'
import { ArenaScene } from '../components/ArenaScene'
import { useToasts } from '../components/Toasts'
import type { ArenaId, Mood } from '../types'
import { sfx } from '../motion/sound'

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

function strength(pw: string) {
  if (pw.length < 8) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++
  return s
}
const strengthLabel = ['Too short', 'Weak', 'Okay', 'Good', 'Strong']

type FieldProps = {
  label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; ok?: boolean
  autoComplete?: string; name: string; reveal?: boolean; inputMode?: 'text' | 'email' | 'numeric'; maxLength?: number
}
function Field({ label, type = 'text', value, onChange, error, ok, autoComplete, name, reveal, inputMode, maxLength }: FieldProps) {
  const [show, setShow] = useState(false)
  const id = `f-${name}`
  return (
    <div>
      <label className={`field ${error ? 'has-error' : ''} ${ok ? 'is-ok' : ''}`} htmlFor={id}>
        <input id={id} name={name} type={reveal && show ? 'text' : type} value={value} placeholder=" " autoComplete={autoComplete} inputMode={inputMode} maxLength={maxLength}
          aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} onChange={(e) => onChange(e.target.value)} />
        <span>{label}</span>
        <span className="field-tail">
          {ok && !reveal && <Icon name="check" size={18} className="ok" />}
          {reveal && <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>}
        </span>
      </label>
      {error && <span id={`${id}-e`} className="field-msg" role="alert">{error}</span>}
    </div>
  )
}

function Strength({ pw }: { pw: string }) {
  const s = pw ? strength(pw) : 0
  return (
    <div className="pw-meter" aria-live="polite">
      <span className="pw-bars">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= s ? `on s${s}` : ''} />)}</span>
      <small>{pw ? strengthLabel[s] : 'Use 8+ characters with a number'}</small>
    </div>
  )
}

function AuthFrame({ title, sub, children, mood, speech, scene = 'mind' }: { title: string; sub?: string; children: ReactNode; mood: Mood; speech: string; scene?: ArenaId }) {
  const { go } = useApp()
  return (
    <div className="auth">
      <section className="auth-form">
        <div className="auth-top"><Logo go={go} /></div>
        <div className="auth-card" >
          <h1 className="t-l">{title}</h1>
          {sub && <p className="muted auth-sub">{sub}</p>}
          {children}
        </div>
        <p className="auth-fine small muted">Your account is stored on the NEXORA server. Game progress stays on this device.</p>
      </section>
      <aside className="auth-art" aria-hidden="false">
        <ArenaScene id={scene} />
        <span className="ap-shade strong" />
        <div className="auth-nexo"><Nexo mood={mood} size={240} speech={speech} /></div>
      </aside>
    </div>
  )
}

const usernameOk = (v: string) => /^[A-Za-z0-9_]{3,16}$/.test(v.trim())

export function Auth() {
  const { go, screen } = useApp()
  const register = screen === 'register'
  const { notify } = useToasts()
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [terms, setTerms] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [offline, setOffline] = useState(false)
  const [serverErr, setServerErr] = useState<{ field: string; msg: string } | null>(null)
  const [mood, setMood] = useState<Mood>('idle')

  useEffect(() => { setTried(false); setFormErr(''); setPw(''); setOffline(false); setServerErr(null) }, [register])

  const errs = {
    name: register ? (usernameOk(name) ? '' : 'Use 3 to 16 letters, numbers or underscores.') : '',
    id: !register && !id.trim() ? 'Enter your email or username.' : '',
    email: register && !emailOk(email) ? 'Enter a valid email address.' : '',
    pw: !pw ? 'Enter your password.' : register && (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) ? 'Use at least 8 characters with letters and a number.' : '',
    terms: register && !terms ? 'Accept the terms to continue.' : '',
  }
  const invalid = Object.values(errs).some(Boolean)
  const fieldErr = (field: 'username' | 'email' | 'password', local: string) => (tried && local) || (serverErr?.field === field ? serverErr.msg : '')

  const sad = () => { setMood('sad'); sfx('wrong'); window.setTimeout(() => setMood('idle'), 1400) }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTried(true); setFormErr(''); setServerErr(null); setOffline(false)
    if (invalid) { sad(); return }
    setBusy(true); setMood('think')
    const r = register ? await registerAccount(name.trim(), email.trim(), pw, remember) : await loginAccount(id.trim(), pw, remember)
    setBusy(false)
    if (!r.ok) {
      if (r.field) setServerErr({ field: r.field, msg: r.error }); else setFormErr(r.error)
      setOffline(!!r.offline)
      sad()
      return
    }
    setMood('cheer')
    adoptAccount(r.me, register)
    if (register) go('onboarding')
    else { notify(`Signed in as ${r.me.username}`); go('hub') }
  }

  /** no server reachable: keep the old on-device demo so the game is still playable */
  const continueOffline = () => {
    if (register) { setProfile({ ...getProfile(), name: name.trim().slice(0, 14) || 'PLAYER', onboarded: false }); go('onboarding') }
    else { notify('Playing offline. Friends and rooms need the server.'); go('hub') }
  }

  return (
    <AuthFrame
      title={register ? 'Create your account' : 'Welcome back'}
      sub={register ? 'Free to play. You get a player ID so friends can find you.' : 'Sign in to pick up where you left off.'}
      mood={mood} speech={mood === 'sad' ? 'Check the highlighted fields.' : mood === 'think' ? 'One moment...' : mood === 'cheer' ? 'Let us go!' : register ? 'Join the game.' : 'Missed you.'}
    >
      <form className="auth-fields" onSubmit={submit} noValidate>
        {register && <Field name="name" label="Username" value={name} onChange={setName} autoComplete="username" maxLength={16} error={fieldErr('username', errs.name)} ok={usernameOk(name) && serverErr?.field !== 'username'} />}
        {register
          ? <Field name="email" label="Email" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="email" error={fieldErr('email', errs.email)} ok={emailOk(email) && serverErr?.field !== 'email'} />
          : <Field name="id" label="Email or username" value={id} onChange={setId} autoComplete="username" error={tried ? errs.id : ''} ok={!!id.trim()} />}
        <Field name="password" label="Password" type="password" reveal value={pw} onChange={setPw} autoComplete={register ? 'new-password' : 'current-password'} error={fieldErr('password', errs.pw)} />
        {register && <Strength pw={pw} />}
        {register ? (
          <div>
            <label className="check"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />I agree to the terms and privacy policy</label>
            {tried && errs.terms && <span className="field-msg" role="alert">{errs.terms}</span>}
          </div>
        ) : (
          <div className="auth-row">
            <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember me</label>
            <button type="button" className="link-btn" onClick={() => notify('Password reset by email is not available yet.')}>Forgot password?</button>
          </div>
        )}
        {formErr && <p className="field-msg" role="alert">{formErr}</p>}
        <Btn type="submit" size="lg" variant="peach" busy={busy} className="auth-submit">{register ? 'Create account' : 'Sign in'}</Btn>
        {offline && <button type="button" className="link-btn" onClick={continueOffline}>Continue offline (no friends or rooms)</button>}
      </form>
      <p className="auth-switch">{register ? 'Already playing?' : 'New to NEXORA?'} <button className="link-btn" onClick={() => go(register ? 'login' : 'register')}>{register ? 'Sign in' : 'Create an account'}</button></p>
    </AuthFrame>
  )
}

export function AccountFlow() {
  const { go, screen } = useApp()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(30)
  const [sent, setSent] = useState(false)
  const timer = useRef(0)

  useEffect(() => {
    setTried(false); setBusy(false); setSent(false)
    if (screen === 'verify' || screen === 'email-sent') { setWait(30); const i = window.setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000); timer.current = i; return () => window.clearInterval(i) }
  }, [screen])

  const resend = () => { if (wait > 0) return; setSent(true); setWait(30); sfx('confirm') }
  const later = (fn: () => void) => { setBusy(true); window.setTimeout(() => { setBusy(false); fn() }, 800) }

  if (screen === 'forgot') {
    const err = emailOk(email) ? '' : 'Enter a valid email address.'
    return (
      <AuthFrame title="Forgot your password?" sub="Enter your email and we will send a reset link if an account exists." mood="think" speech="Happens to everyone.">
        <form className="auth-fields" noValidate onSubmit={(e) => { e.preventDefault(); setTried(true); if (!err) later(() => go('email-sent')) }}>
          <Field name="email" label="Email" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="email" error={tried ? err : ''} ok={!err} />
          <Btn type="submit" size="lg" variant="peach" busy={busy} className="auth-submit">Send reset link</Btn>
        </form>
        <p className="auth-switch"><button className="link-btn" onClick={() => go('login')}>Back to sign in</button></p>
      </AuthFrame>
    )
  }

  if (screen === 'email-sent') {
    return (
      <AuthFrame title="Check your inbox" sub="If an account exists for that email, a reset link is on its way. It expires in 30 minutes." mood="happy" speech="Mail's on the way.">
        <div className="auth-fields">
          <div className="mail-ico"><Icon name="mail" size={40} /></div>
          <Btn size="lg" variant="peach" onClick={() => go('reset')}>Open reset link (demo)</Btn>
          <Btn variant="ghost" disabled={wait > 0} cue="click" icon="refresh" onClick={resend}>{wait > 0 ? `Resend in ${wait}s` : sent ? 'Sent again' : 'Resend email'}</Btn>
        </div>
        <p className="auth-switch"><button className="link-btn" onClick={() => go('login')}>Back to sign in</button></p>
      </AuthFrame>
    )
  }

  if (screen === 'reset') {
    const e1 = strength(pw) < 2 ? 'Use at least 8 characters with letters and a number.' : ''
    const e2 = pw2 !== pw || !pw2 ? 'Passwords do not match.' : ''
    return (
      <AuthFrame title="Set a new password" sub="Choose something you do not use anywhere else." mood="think" speech="Make it a good one.">
        <form className="auth-fields" noValidate onSubmit={(e) => { e.preventDefault(); setTried(true); if (!e1 && !e2) later(() => go('reset-success')) }}>
          <Field name="new-password" label="New password" type="password" reveal value={pw} onChange={setPw} autoComplete="new-password" error={tried ? e1 : ''} />
          <Strength pw={pw} />
          <Field name="confirm-password" label="Confirm password" type="password" reveal value={pw2} onChange={setPw2} autoComplete="new-password" error={tried ? e2 : ''} />
          <Btn type="submit" size="lg" variant="peach" busy={busy} className="auth-submit">Update password</Btn>
        </form>
      </AuthFrame>
    )
  }

  if (screen === 'reset-success') {
    return (
      <AuthFrame title="Password updated" sub="You can sign in with your new password now." mood="cheer" speech="Back in business.">
        <div className="auth-fields"><div className="mail-ico ok"><Icon name="check" size={44} /></div><Btn size="lg" variant="peach" onClick={() => go('login')}>Sign in</Btn></div>
      </AuthFrame>
    )
  }

  // verify
  const err = /^\d{6}$/.test(code) ? '' : 'Enter the 6-digit code.'
  return (
    <AuthFrame title="Verify your email" sub="We sent a 6-digit code to your inbox. In this demo any 6 digits will work." mood="search" speech="Almost there.">
      <form className="auth-fields" noValidate onSubmit={(e) => { e.preventDefault(); setTried(true); if (!err) later(() => go('onboarding')) }}>
        <Field name="code" label="6-digit code" inputMode="numeric" maxLength={6} value={code} onChange={(v) => setCode(v.replace(/\D/g, ''))} autoComplete="one-time-code" error={tried ? err : ''} ok={!err} />
        <Btn type="submit" size="lg" variant="peach" busy={busy} className="auth-submit">Verify</Btn>
        <Btn variant="ghost" disabled={wait > 0} cue="click" icon="refresh" onClick={resend}>{wait > 0 ? `Resend in ${wait}s` : sent ? 'Code sent again' : 'Resend code'}</Btn>
      </form>
    </AuthFrame>
  )
}

export function Onboarding() {
  const { go } = useApp()
  const { me } = useAccount()
  const { notify } = useToasts()
  const p = getProfile()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(p.name === 'JENISH' ? '' : p.name)
  const [picks, setPicks] = useState<ArenaId[]>(['mind', 'knowledge'])
  const toggle = (id: ArenaId) => setPicks((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  const finish = (target: 'hub' | 'arenas') => { setProfile({ ...getProfile(), name: me ? me.username : (name.trim() || 'PLAYER').toUpperCase().slice(0, 14), onboarded: true }); go(target) }
  const copyUid = async () => { if (!me) return; try { await navigator.clipboard.writeText(me.uid) } catch { /* ignore */ } notify('Player ID copied') }
  const titles = [me ? 'This is your player ID' : 'What should we call you?', 'Which arenas are you into?', 'You are ready.']
  const speech = [me ? `Welcome, ${me.username}. Friends add you with this.` : 'I am NEXO. I will be your rival.', 'Pick as many as you like.', 'Go easy on me. Or do not.']
  const moods: Mood[] = ['wink', 'search', 'cheer']
  return (
    <div className="onb">
      <div className="onb-top"><Logo /><span className="muted small">Step {step + 1} of 3</span></div>
      <div className="onb-bar" aria-hidden="true"><i style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      <div className="onb-body" key={step}>
        <Nexo mood={moods[step]} size={190} speech={speech[step]} />
        <h1 className="t-xl">{titles[step]}</h1>
        {step === 0 && me && (
          <div className="onb-uid">
            <b className="display lobby-id" aria-label={`Player ID ${me.uid}`}>{me.uid}</b>
            <Btn variant="cream" size="sm" icon="copy" cue="click" onClick={copyUid}>Copy ID</Btn>
            <p className="muted small">Friends can find you by this ID or by your username, {me.username}. You can see it again in Social.</p>
          </div>
        )}
        {step === 0 && !me && <div className="onb-field"><Field name="display" label="Display name" value={name} onChange={setName} maxLength={14} autoComplete="nickname" ok={name.trim().length >= 2} /></div>}
        {step === 1 && (
          <div className="onb-picks" role="group" aria-label="Arenas">
            {arenas.map((a) => (
              <button key={a.id} className={`onb-pick ${picks.includes(a.id) ? 'is-on' : ''}`} aria-pressed={picks.includes(a.id)} onClick={() => toggle(a.id)} style={{ ['--accent' as string]: `var(--${a.id})` }}>
                <span className="onb-art"><ArenaScene id={a.id} /></span><b>{a.name}</b><i><Icon name="check" size={14} /></i>
              </button>
            ))}
          </div>
        )}
        {step === 2 && <p className="lead">Your first match is against NEXO, five short rounds. You can change anything later in Settings.</p>}
      </div>
      <div className="onb-foot">
        {step > 0 ? <button className="link-btn" onClick={() => setStep(step - 1)}>Back</button> : <span />}
        {step < 2
          ? <Btn size="lg" variant="peach" disabled={step === 0 && !me && name.trim().length < 2} onClick={() => setStep(step + 1)}>Continue</Btn>
          : <div className="onb-end"><Btn size="lg" variant="peach" icon="play" magnetic onClick={() => finish('arenas')}>Play first match</Btn><button className="link-btn" onClick={() => finish('hub')}>Explore first</button></div>}
      </div>
    </div>
  )
}
