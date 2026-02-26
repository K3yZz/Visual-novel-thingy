import { React } from '@lib/imports'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './app'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
