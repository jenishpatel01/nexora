# NEXORA

Competitive intelligence game. Six arenas (Coding, Debate, Roast, Business, Knowledge, Mind games), five-round matches against NEXO (AI), ELO ranks, XP, achievements, leaderboard, profile, rooms, tournaments.

React 19 + Vite + TypeScript (strict) + plain CSS.

```
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run lint
npm run build
```

## Structure
- `src/game/` engine (rounds, AI, ELO, XP, ranks, achievements), content banks, persisted profile store
- `src/screens/` every screen (hash-routed, lazy loaded)
- `src/components/` Shell, Nexo (character), WorldCard, ArenaScene (procedural arena backgrounds), Btn, XPBar, Toasts…
- `src/motion/` custom cursor, magnetic buttons, reveal, count-up, tilt, optional WebAudio sound
- `src/styles/` tokens + CSS per area

## Notes
- Demo data: online player counts, other leaderboard players, friends, tournaments. There is no backend; matchmaking always falls back to NEXO, and "friends" in rooms are played by NEXO.
- Auth screens are front-end only. No passwords are stored; reset/forgot never reveals whether an email exists.
- Sound is off by default (Settings). Reduced motion follows the OS setting and an in-app toggle.


## Accounts, friends and live rooms (real multiplayer)

`server/index.mjs` is one small Node process. It serves the built site from `dist/`, a JSON API at `/api` and a WebSocket at `/ws`.

```
npm install
npm run build
npm start            # site + server on http://localhost:8787
```

**Accounts.** Sign up with a username, email and password. Every account gets a unique player ID like `NXU-7K2M9Q`, shown after sign-up and in Social and Settings. Passwords are hashed with scrypt. Session tokens are stored hashed. Accounts are saved to `DATA_DIR/db.json` (default `server/data/`). Sign-in and sign-up are rate limited.

**Friends.** Social has three tabs. Add friends searches by username or player ID and sends a request. Requests lists incoming requests (Accept or Decline) and the ones you sent (Cancel). Friends shows who is online and has a Challenge button. Everything updates live over the socket.

**Playing.** Challenge a friend, or press Play with friends, pick an arena and create a room. The invite appears on the friend's screen as a card. They press Accept, both land in the lobby, the host starts, and both play the same five rounds (shared seed). Room codes like `NX-48291` still work for anyone signed in. Room matches are friendly: no ELO change.

**Deploying.** Use a host that runs Node, supports WebSockets and gives the server a disk that survives restarts (a VPS, Fly.io with a volume, or Render's Starter plan with a disk, see `render.yaml`). Set `DATA_DIR` to the disk's path. On a host with no persistent disk, accounts disappear when the server restarts. If the site is served from a different host than the server, build with `VITE_WS_URL=wss://your-server.example.com/ws npm run build` and set `CORS_ORIGIN=https://your-site.example.com` on the server.

**Dev mode.** `npm run dev` starts the server (port 8787) and Vite (port 5173) together, and Vite proxies `/api` and `/ws` to the server. Open http://localhost:5173. `npm run dev:web` starts Vite alone, which cannot sign anyone in.

**Limits.**
- Password reset by email and email verification are not built (there is no mail service). "Forgot password" shows a notice.
- Rating, XP and match history are stored on the player's device, not on the server. Friends see the rating the player's browser reports.
- If the server cannot be reached, sign-in offers "Continue offline", which keeps the single-player game working without friends or rooms.
- Matchmaking by rating, the leaderboard and tournaments still use sample data.
- If a player drops mid-match, the match ends unscored.
