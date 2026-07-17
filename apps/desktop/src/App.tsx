import { useEffect } from 'react'
import { LiveToggle } from './LiveToggle'
import { hidePanel } from './panel'

export function App() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') void hidePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="app">
      <LiveToggle />
      <p className="hint">
        Type anywhere — Uzbek Cyrillic or old-Latin becomes reformed new-Latin as
        you go. Works in most text fields; password fields and terminals are left
        alone.
      </p>
    </main>
  )
}
