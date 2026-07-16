import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { registerLiveTransform } from './liveTransform'
import './styles.css'

// Only wire the Rust bridge when actually running inside Tauri — in a plain
// browser (tests, `vite dev`) there is no Tauri runtime to listen/invoke.
if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
  void registerLiveTransform()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
