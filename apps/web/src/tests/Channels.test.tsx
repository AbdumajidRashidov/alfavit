import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Channels } from '../components/Channels'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders groups, platforms, and CTAs with macOS and Windows live for download', () => {
  renderWithLocale(<Channels />, '/en')
  for (const label of ['Desktop', 'Mobile', 'More ways']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  for (const name of ['macOS', 'Windows', 'iOS', 'Android', 'Web app', 'Telegram bot', 'Browser extension', 'API & SDK']) {
    expect(screen.getByText(name)).toBeInTheDocument()
  }
  // macOS and Windows are live: two Download links to the hosted installers.
  const downloads = screen.getAllByRole('link', { name: 'Download' }).map((a) => a.getAttribute('href'))
  // Counted routes: the collect Worker records the download, then 302s to the installer.
  expect(downloads).toEqual(['/dl/mac', '/dl/win'])
  // Both desktop cards show the New badge + the live-transform description.
  expect(screen.getAllByText('New')).toHaveLength(2)
  expect(screen.getAllByText(/converts to new-Latin/i)).toHaveLength(2)
  expect(screen.getByText(/SmartScreen/)).toBeInTheDocument()
  // Three "Open" links remain: Web (/en), Telegram (external), API (/en/developers).
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain('/en')
  expect(openHrefs).toContain('https://t.me/alfavit_uz_bot')
  expect(openHrefs).toContain('/en/developers')
  // Three remain Coming soon: iOS, Android, extension.
  expect(screen.getAllByText('Coming soon')).toHaveLength(3)
})

test('extension card goes live when a store URL is provided', () => {
  const url = 'https://chromewebstore.google.com/detail/alfavit/abcdefghijklmnop'
  renderWithLocale(<Channels extensionStoreUrl={url} />, '/en')
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain(url)
  expect(screen.getAllByText('Coming soon')).toHaveLength(2)
})
