import { useEffect } from 'react'
import { LiveConverter } from './LiveConverter'
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
      <LiveConverter />
    </main>
  )
}
