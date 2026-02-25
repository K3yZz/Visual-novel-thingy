import { StrictMode, createRoot } from '@/lib/react'

import Scene from './scene.jsx'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Scene />
  </StrictMode>,
)
