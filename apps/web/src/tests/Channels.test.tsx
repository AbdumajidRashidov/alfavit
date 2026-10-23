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
  // Both app cards and both layout cards show the New badge; only the apps carry the live-transform description.
  expect(screen.getAllByText('New')).toHaveLength(4)
  expect(screen.getAllByText(/converts to new-Latin/i)).toHaveLength(2)
  expect(screen.getByText(/SmartScreen/)).toBeInTheDocument()
  // Three "Open" links remain: Web (/en), Telegram (external), API (/en/developers).
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain('/en')
  expect(openHrefs).toContain('https://t.me/alfavit_uz_bot')
  expect(openHrefs).toContain('/en/developers')
  // The two layout cards open the layout page (installing needs its instructions), never a raw download.
  expect(openHrefs.filter((h) => h === '/en/keyboard-layout')).toHaveLength(2)
  for (const name of ['Keyboard layout — macOS', 'Keyboard layout — Linux']) expect(screen.getByText(name)).toBeInTheDocument()
  // Two remain Coming soon: iOS and Android. The extension is in the Chrome Web Store.
  expect(screen.getAllByText('Coming soon')).toHaveLength(2)
})

const STORE = 'https://chromewebstore.google.com/detail/alfavit-%E2%80%94-new-uzbek-latin/nfklgogkhkinngpbiijniglifomklcmo'

test('the extension card opens its Chrome Web Store listing, with no tracking or language parameters', () => {
  renderWithLocale(<Channels />, '/en')
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain(STORE)
})

test('extension card goes live when a store URL is provided', () => {
  const url = 'https://chromewebstore.google.com/detail/alfavit/abcdefghijklmnop'
  renderWithLocale(<Channels extensionStoreUrl={url} />, '/en')
  const openHrefs = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'))
  expect(openHrefs).toContain(url)
  expect(screen.getAllByText('Coming soon')).toHaveLength(2)
})
