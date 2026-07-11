import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Channels } from '../components/Channels'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders download groups, platforms, and CTAs', () => {
  render(
    <LanguageProvider>
      <MemoryRouter>
        <Channels />
      </MemoryRouter>
    </LanguageProvider>,
  )
  for (const label of ['Desktop', 'Mobile', 'More ways']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  for (const name of ['macOS', 'Windows', 'iOS', 'Android', 'Web app', 'Telegram bot', 'Browser extension', 'API & SDK']) {
    expect(screen.getByText(name)).toBeInTheDocument()
  }
  // Three live channels → Open links: Web (/), Telegram (external), API (/developers).
  const hrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(hrefs).toContain('/')
  expect(hrefs).toContain('https://t.me/alfavit_uz_bot')
  expect(hrefs).toContain('/developers')
  // The remaining five (macOS, Windows, iOS, Android, extension) are Coming soon.
  expect(screen.getAllByText('Coming soon')).toHaveLength(5)
})
