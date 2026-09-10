import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { NewsStrip } from '../components/NewsStrip'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('links to the localized reform page (en)', () => {
  renderWithLocale(<NewsStrip />, '/en')
  expect(screen.getByRole('link', { name: /Senate approved the 28-letter alphabet/ })).toHaveAttribute('href', '/en/reform')
})

test('uz is the default locale at the root path', () => {
  renderWithLocale(<NewsStrip />, '/')
  expect(screen.getByRole('link', { name: /Senat/ })).toHaveAttribute('href', '/reform')
})
