import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi, beforeEach } from 'vitest'
import { Nav } from '../components/Nav'
import { renderApp, renderWithLocale } from './renderApp'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true }) // → uz fallback
  // Reduced-motion so Hero's video loop takes the static path under jsdom (renderApp renders HomePage).
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false,
  }))
})

function renderNav() {
  return renderWithLocale(<Nav />, '/')
}

test('renders logo, route links, and localized CTA', () => {
  renderNav()
  expect(screen.getByText(/Alfavit/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Boshlash' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Islohot' })).toHaveAttribute('href', '/reform')
  // Convert, Developers, and Telegram were moved to the footer — not in the nav.
  expect(screen.queryByRole('link', { name: 'Oʻgirish' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Dasturchilar' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Telegram' })).toBeNull()
})

test('switching language navigates and re-localizes', async () => {
  const user = userEvent.setup()
  renderApp('/')
  await user.click(screen.getByRole('button', { name: 'RU' }))
  expect(await screen.findByRole('link', { name: 'Начать' })).toBeInTheDocument()
})

test('mobile menu toggles open', async () => {
  const user = userEvent.setup()
  renderNav()
  expect(screen.queryByTestId('mobile-menu')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Menu' }))
  expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
})
