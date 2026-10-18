import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/wdth.css'
import '@fontsource-variable/figtree/wght.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/ui.css'
import './styles/nexo.css'
import './styles/scenes.css'
import './styles/layout.css'
import './styles/landing.css'
import './styles/screens.css'
import './styles/game.css'
import { applySettings } from './settings'
import App from './App'

applySettings()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
