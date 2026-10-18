import { useApp } from '../app/context'
import { useAccount } from '../net/account'
import { Btn } from './Btn'
import { Nexo } from './Nexo'

/** shown where a feature needs a real account (friends, rooms) */
export function SignInGate({ title = 'Sign in to play with friends', note = 'Rooms and friends need a NEXORA account so people can find and invite you.' }: { title?: string; note?: string }) {
  const { go } = useApp()
  const { token, ready } = useAccount()
  // a saved session is still being checked with the server
  if (token && !ready) return <div className="page empty"><p className="muted" role="status">Checking your session...</p></div>
  return (
    <div className="page empty">
      <Nexo mood="wink" size={150} speech="Join the game." />
      <h1 className="t-l">{title}</h1>
      <p className="muted">{note}</p>
      <div className="hub-cta"><Btn variant="peach" onClick={() => go('register')}>Create account</Btn><Btn variant="ghost" onClick={() => go('login')}>Sign in</Btn></div>
    </div>
  )
}
