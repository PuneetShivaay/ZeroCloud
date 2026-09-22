import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DesktopApp from './DesktopApp.jsx'

// `window.zerocloud` is injected only by the Electron preload script.
// In a browser it is undefined, so the existing web demo renders unchanged.
const Root = window.zerocloud ? DesktopApp : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
