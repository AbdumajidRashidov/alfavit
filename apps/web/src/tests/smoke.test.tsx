import { render, screen } from '@testing-library/react'
import { expect, test, vi, beforeEach } from 'vitest'
import App from '../App'

// Force reduced-motion so no WebGL canvas mounts under jsdom.
beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false,
  }))
})

test('full page renders hero, converter, and footer without crashing', () => {
  render(<App />)
  expect(screen.getAllByText(/Alfavit/).length).toBeGreaterThanOrEqual(1) // hero nav + footer logos
  expect(document.getElementById('converter')).toBeInTheDocument()          // converter
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()               // footer
})
