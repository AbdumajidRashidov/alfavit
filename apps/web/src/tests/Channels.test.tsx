import { render, screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Channels } from '../components/Channels'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders download groups, platforms, and CTAs', () => {
  render(<LanguageProvider><Channels /></LanguageProvider>)
  for (const label of ['Desktop', 'Mobile', 'More ways']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  for (const name of ['macOS', 'Windows', 'iOS', 'Android', 'Web app', 'Telegram bot', 'Browser extension', 'API & SDK']) {
    expect(screen.getByText(name)).toBeInTheDocument()
  }
  // Web is live → an Open button (scrolls to the converter).
  expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  // Telegram bot and the API are live → Open links (external + in-page).
  const hrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(hrefs).toContain('https://t.me/alfavit_uz_bot')
  expect(hrefs).toContain('#developers')
  // The remaining five (macOS, Windows, iOS, Android, extension) are Coming soon.
  expect(screen.getAllByText('Coming soon')).toHaveLength(5)
})
