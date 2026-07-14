import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Channels } from '../components/Channels'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders download groups, platforms, and CTAs', () => {
  renderWithLocale(<Channels />, '/en')
  for (const label of ['Desktop', 'Mobile', 'More ways']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  for (const name of ['macOS', 'Windows', 'iOS', 'Android', 'Web app', 'Telegram bot', 'Browser extension', 'API & SDK']) {
    expect(screen.getByText(name)).toBeInTheDocument()
  }
  // Three live channels → Open links: Web (/en), Telegram (external), API (/en/developers).
  const hrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(hrefs).toContain('/en')
  expect(hrefs).toContain('https://t.me/alfavit_uz_bot')
  expect(hrefs).toContain('/en/developers')
  // The remaining five (macOS, Windows, iOS, Android, extension) are Coming soon.
  expect(screen.getAllByText('Coming soon')).toHaveLength(5)
})
