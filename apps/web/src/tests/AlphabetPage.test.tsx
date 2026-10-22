import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { AlphabetPage } from '../pages/AlphabetPage'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders a changed letter with new, old-Latin, and Cyrillic', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  // Rendered in both the desktop table and mobile cards, so use getAllByText.
  expect(screen.getAllByText('Ö ö').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Oʻ oʻ').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Ў ў').length).toBeGreaterThan(0)
})

test('renders an unchanged letter and marks the four changed ones', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  expect(screen.getAllByText('A a').length).toBeGreaterThan(0)
  // 4 changed letters, each shown in the table AND the mobile cards -> >= 4 badges.
  expect(screen.getAllByText('Changed').length).toBeGreaterThanOrEqual(4)
})

test('shows the tutuq belgisi note', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  expect(screen.getByText(/Tutuq belgisi/)).toBeInTheDocument()
})

test('shows the loanword note', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  expect(screen.getByText(/In loanwords/)).toBeInTheDocument()
})

// 68% of visits land here and 78-85% never reach the home page's converter,
// so the page carries its own, directly under the intro.
test('offers the converter right under the intro, ahead of the letter count and the table', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  const intro = screen.getByText(/has 28 letters and the tutuq belgisi/)
  const heading = screen.getByRole('heading', { name: 'Convert your text to the new alphabet' })
  const input = screen.getByRole('textbox', { name: 'Cyrillic or old Latin' })
  const count = screen.getByRole('heading', { name: 'How many letters are in the Uzbek alphabet?' })
  const table = screen.getByRole('table')
  const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  expect(follows(intro, heading)).toBe(true)
  expect(follows(heading, input)).toBe(true)
  expect(follows(input, count)).toBe(true)
  expect(follows(count, table)).toBe(true)
})
