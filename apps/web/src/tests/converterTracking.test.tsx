import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach, vi } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Converter } from '../components/Converter'

const SECRET_TEXT = 'салом дунё жуда махфий матн'
const COPY_BTN = /Copy|Nusxa|Копировать/

let sent: string[]

beforeEach(() => {
  sent = []
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: (_url: string, body: string) => { sent.push(body); return true },
  })
})

const beacons = () => sent.map((s) => JSON.parse(s) as { e: string; d: string; u: string; r: string })

test('THE PRIVACY GUARANTEE: no beacon ever contains the typed text', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Converter />)
  await user.type(screen.getByRole('textbox'), SECRET_TEXT)
  await screen.findByText(/salom/)

  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
  await user.click(screen.getByRole('button', { name: COPY_BTN }))

  const all = sent.join('\n')
  expect(all).not.toContain(SECRET_TEXT)
  expect(all).not.toContain('салом')
  expect(all).not.toContain('махфий')
  // Nor the transliterated output.
  expect(all).not.toContain('salom')
})

test('typing fires one transliterate event carrying only the detected script', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Converter />)
  await user.type(screen.getByRole('textbox'), 'салом')

  const events = beacons().filter((b) => b.e === 'transliterate')
  expect(events).toHaveLength(1)
  expect(events[0].d).toBe('cyrillic')
})

test('transliterate fires once per session, not once per keystroke', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Converter />)
  await user.type(screen.getByRole('textbox'), 'салом дунё')
  expect(beacons().filter((b) => b.e === 'transliterate')).toHaveLength(1)
})

test('old-latin input is reported as old-latin', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Converter />)
  await user.type(screen.getByRole('textbox'), "o'zbek tili")

  const events = beacons().filter((b) => b.e === 'transliterate')
  expect(events).toHaveLength(1)
  expect(events[0].d).toBe('old-latin')
})

test('copying fires a copy event with no detail', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Converter />)
  await user.type(screen.getByRole('textbox'), 'салом')
  await screen.findByText(/salom/)

  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
  await user.click(screen.getByRole('button', { name: COPY_BTN }))

  const copies = beacons().filter((b) => b.e === 'copy')
  expect(copies).toHaveLength(1)
  expect(copies[0].d).toBe('')
})
