import { useEffect } from 'react'
import { LiveConverter } from './LiveConverter'
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
      <LiveConverter />
    </main>
  )
}
