import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Developers } from '../components/Developers'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('shows the API endpoint and title', () => {
  renderWithLocale(<Developers />, '/en')
  expect(screen.getByText('Developers')).toBeInTheDocument()
  expect(screen.getByTestId('endpoint')).toHaveTextContent('/v1/transliterate')
})
