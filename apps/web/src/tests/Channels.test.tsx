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
  // Web is live → an Open button; the other seven are Coming soon.
  expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  expect(screen.getAllByText('Coming soon')).toHaveLength(7)
})
