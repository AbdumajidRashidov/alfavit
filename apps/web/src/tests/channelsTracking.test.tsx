import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Channels } from '../components/Channels'

let sent: string[]

beforeEach(() => {
  localStorage.clear()
  sent = []
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: (_url: string, body: string) => { sent.push(body); return true },
  })
})

const beacons = () => sent.map((s) => JSON.parse(s) as { e: string; d: string })

test('installer links point at the counted routes', () => {
  renderWithLocale(<Channels />, '/en')
  const downloads = screen.getAllByRole('link', { name: 'Download' }).map((a) => a.getAttribute('href'))
  expect(downloads).toEqual(['/dl/mac', '/dl/win'])
})

test('clicking the Telegram link fires an outbound event tagged bot', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Channels />, '/en')
  const telegram = screen.getAllByRole('link', { name: 'Open' })
    .find((a) => a.getAttribute('href') === 'https://t.me/alfavit_uz_bot')!
  await user.click(telegram)

  const events = beacons().filter((b) => b.e === 'outbound')
  expect(events).toHaveLength(1)
  expect(events[0].d).toBe('bot')
})

test('clicking the extension link fires an outbound event tagged extension', async () => {
  const user = userEvent.setup()
  const url = 'https://chromewebstore.google.com/detail/alfavit/abcdefghijklmnop'
  renderWithLocale(<Channels extensionStoreUrl={url} />, '/en')
  const ext = screen.getAllByRole('link', { name: 'Open' })
    .find((a) => a.getAttribute('href') === url)!
  await user.click(ext)

  const events = beacons().filter((b) => b.e === 'outbound')
  expect(events).toHaveLength(1)
  expect(events[0].d).toBe('extension')
})

test('internal links do not fire outbound events', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Channels />, '/en')
  const developers = screen.getAllByRole('link', { name: 'Open' })
    .find((a) => a.getAttribute('href') === '/en/developers')!
  await user.click(developers)

  expect(beacons().filter((b) => b.e === 'outbound')).toHaveLength(0)
})
