import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { expect, test, vi, beforeEach } from 'vitest'
import { routes } from '../router'
import type { RouteObject } from 'react-router-dom'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
  // Reduced-motion so Hero's video loop takes the static path under jsdom.
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false,
  }))
})

function renderAt(path: string) {
  const router = createMemoryRouter(routes as unknown as RouteObject[], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

test('/ renders the converter', () => {
  renderAt('/')
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

test('/developers renders the API endpoint', () => {
  renderAt('/developers')
  expect(screen.getByTestId('endpoint')).toHaveTextContent('/v1/transliterate')
})

test('/files renders the file input', () => {
  renderAt('/files')
  expect(screen.getByTestId('file-input')).toBeInTheDocument()
})

test('/apps renders the channels', () => {
  renderAt('/apps')
  expect(screen.getByText('Telegram bot')).toBeInTheDocument()
})

test('/reform renders the reform letter changes', () => {
  renderAt('/reform')
  for (const glyph of ['Ş ş', 'Ŏ ŏ', 'Ç ç', 'Ğ ğ']) {
    expect(screen.getByText(glyph)).toBeInTheDocument()
  }
})
