import { render, screen } from '@testing-library/react'
import { expect, test, vi, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { MorphShowcase } from '../components/MorphShowcase'

// jsdom has no WebGL; force the reduced-motion (static) path so no canvas mounts.
beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false,
  }))
})

test('renders all four reform letter pairs (static, reduced-motion)', () => {
  render(<LanguageProvider><MorphShowcase /></LanguageProvider>)
  for (const glyph of ['ş', 'ŏ', 'ç', 'ğ']) {
    expect(screen.getByText(glyph)).toBeInTheDocument()
  }
})
