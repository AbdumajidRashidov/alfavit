import { screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { renderWithLocale } from './renderApp'
import { StatusPage } from '../pages/StatusPage'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

afterEach(() => {
  vi.useRealTimers()
})

test('gives the date the law takes effect, and answers "when" under its own heading', () => {
  renderWithLocale(<StatusPage />, '/en')
  // Also a timeline row, so pick the machine-readable one.
  const date = screen.getAllByText('22 April 2027').find((el) => el.tagName === 'TIME')
  expect(date).toHaveAttribute('datetime', '2027-04-22')
  expect(screen.getByRole('heading', { level: 2, name: 'When does the new alphabet take effect?' })).toBeInTheDocument()
  expect(screen.getByText(/Law No\. LRU-1184 was officially published on 21 October 2026/)).toBeInTheDocument()
})

test('counts the days left in Tashkent time once it has rendered in the browser', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-22T12:00:00+05:00'))
  renderWithLocale(<StatusPage />, '/en')
  expect(await screen.findByText(/182 days to go/)).toBeInTheDocument()
})

test('shows no countdown once the date has passed', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2027-05-01T12:00:00+05:00'))
  renderWithLocale(<StatusPage />, '/en')
  expect(screen.getAllByText('22 April 2027').some((el) => el.tagName === 'TIME')).toBe(true)
  expect(screen.queryByText(/days to go/)).not.toBeInTheDocument()
})

test('links to the keyboard guide', () => {
  renderWithLocale(<StatusPage />, '/en')
  expect(screen.getByRole('link', { name: 'How to type ö ğ ş ç' })).toHaveAttribute('href', '/en/guide/keyboard')
})
