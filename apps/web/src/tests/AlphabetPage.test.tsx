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
