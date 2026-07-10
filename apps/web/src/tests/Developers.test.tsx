import { render, screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Developers } from '../components/Developers'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('shows the API endpoint and title', () => {
  render(<LanguageProvider><Developers /></LanguageProvider>)
  expect(screen.getByText('Developers')).toBeInTheDocument()
  expect(screen.getByTestId('endpoint')).toHaveTextContent('/v1/transliterate')
})
