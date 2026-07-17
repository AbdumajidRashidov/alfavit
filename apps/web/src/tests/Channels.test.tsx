import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Channels } from '../components/Channels'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders groups, platforms, and CTAs with macOS live for download', () => {
  renderWithLocale(<Channels />, '/en')
  for (const label of ['Desktop', 'Mobile', 'More ways']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  for (const name of ['macOS', 'Windows', 'iOS', 'Android', 'Web app', 'Telegram bot', 'Browser extension', 'API & SDK']) {
    expect(screen.getByText(name)).toBeInTheDocument()
  }
  // macOS is now live: a Download link to the hosted universal dmg.
  const dl = screen.getByRole('link', { name: 'Download' })
  expect(dl).toHaveAttribute('href', '/download/Alfavit.dmg')
  // macOS shows the New badge + the live-transform description.
  expect(screen.getByText('New')).toBeInTheDocument()
  expect(screen.getByText(/converts to new-Latin/i)).toBeInTheDocument()
  // Three "Open" links remain: Web (/en), Telegram (external), API (/en/developers).
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain('/en')
  expect(openHrefs).toContain('https://t.me/alfavit_uz_bot')
  expect(openHrefs).toContain('/en/developers')
  // Four remain Coming soon: Windows, iOS, Android, extension.
  expect(screen.getAllByText('Coming soon')).toHaveLength(4)
})
