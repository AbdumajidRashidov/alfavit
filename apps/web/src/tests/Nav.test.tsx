import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Nav } from '../components/Nav'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true }) // → uz fallback
})

function renderNav() {
  return render(
    <LanguageProvider>
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    </LanguageProvider>,
  )
}

test('renders logo, route links, and localized CTA; switches language', async () => {
  const user = userEvent.setup()
  renderNav()
  expect(screen.getByText(/Alfavit/)).toBeInTheDocument()
  // CTA is now a link
  expect(screen.getByRole('link', { name: 'Boshlash' })).toBeInTheDocument()
  // Developers route link points at /developers
  expect(screen.getByRole('link', { name: 'Dasturchilar' })).toHaveAttribute('href', '/developers')
  await user.click(screen.getByRole('button', { name: 'RU' }))
  expect(screen.getByRole('link', { name: 'Начать' })).toBeInTheDocument()
})
