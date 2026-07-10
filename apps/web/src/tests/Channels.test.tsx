import { render, screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Channels } from '../components/Channels'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders all six channels with their statuses', () => {
  render(<LanguageProvider><Channels /></LanguageProvider>)
  for (const name of ['Web', 'Telegram bot', 'API & SDK', 'Browser extension', 'Desktop', 'Mobile']) {
    expect(screen.getByText(name)).toBeInTheDocument()
  }
  expect(screen.getByText('Available')).toBeInTheDocument()
  expect(screen.getAllByText('Coming soon')).toHaveLength(2)
  expect(screen.getAllByText('Planned')).toHaveLength(3)
})
