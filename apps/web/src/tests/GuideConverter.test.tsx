import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderWithLocale } from './renderApp'
import { GuideCyrillicPage } from '../pages/GuideCyrillicPage'
import { GuideOldLatinPage } from '../pages/GuideOldLatinPage'
import { GuideKeyboardPage } from '../pages/GuideKeyboardPage'

test.each([
  ['Cyrillic guide', GuideCyrillicPage],
  ['old-Latin guide', GuideOldLatinPage],
])('the %s puts the converter before the steps', (_name, Page) => {
  const { container } = renderWithLocale(<Page />, '/en')
  const input = container.querySelector('#converter-input')
  const firstStep = container.querySelector('ol')
  expect(input).not.toBeNull()
  expect(input!.compareDocumentPosition(firstStep!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('the keyboard guide has no converter', () => {
  const { container } = renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(container.querySelector('#converter-input')).toBeNull()
})

test('the uz titles carry the search phrases', () => {
  renderWithLocale(<GuideCyrillicPage />, '/')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kirilldan yangi lotinga')
})

test("a conversion on the guide is reported with the guide's path", async () => {
  window.history.pushState({}, '', '/guide/cyrillic-to-latin')
  const sendBeacon = vi.fn().mockReturnValue(true)
  Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true, writable: true })
  const user = userEvent.setup()
  const { container } = renderWithLocale(<GuideCyrillicPage />, '/')
  await user.type(container.querySelector('#converter-input')!, 'салом')
  const call = sendBeacon.mock.calls.find(([, b]) => JSON.parse(b as string).e === 'transliterate')!
  const body = JSON.parse(call[1] as string)
  expect(new URL(body.u).pathname).toBe('/guide/cyrillic-to-latin')
  expect(body).not.toHaveProperty('text')
  window.history.pushState({}, '', '/')
})

// Review of aceb175: with the converter on the page, the guide still sent
// people to the home page (step 2 and the closing button).
test.each([
  ['/en', GuideCyrillicPage], ['/', GuideCyrillicPage], ['/ru', GuideCyrillicPage],
  ['/en', GuideOldLatinPage], ['/', GuideOldLatinPage], ['/ru', GuideOldLatinPage],
])('at %s the guide keeps visitors on the page', (path, Page) => {
  const { container } = renderWithLocale(<Page />, path)
  expect(container.textContent).not.toMatch(/home page|bosh sahifa|главной странице/i)
  expect(container.querySelector('a[href="/"], a[href="/en"], a[href="/ru"]')).toBeNull()
})

test('the Cyrillic guide shows a Cyrillic example to paste', () => {
  const { container } = renderWithLocale(<GuideCyrillicPage />, '/')
  expect(container.querySelector('#converter-input')!.getAttribute('placeholder')).toMatch(/[Ѐ-ӿ]/)
})

// /kirill exists at the root only; the Cyrillic guide is where Cyrillic readers arrive.
test.each(['/', '/ru', '/en'])('the Cyrillic guide at %s links to /kirill', (path) => {
  const { container } = renderWithLocale(<GuideCyrillicPage />, path)
  expect(container.querySelector('a[href="/kirill"]')).not.toBeNull()
})
