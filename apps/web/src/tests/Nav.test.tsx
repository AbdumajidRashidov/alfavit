import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { Nav } from '../components/Nav'

beforeEach(() => {
  localStorage.clear()
  // Force a non-uz/ru/en browser language so the default resolves to Uzbek.
  Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true })
})

test('renders logo and localized CTA, switches language', async () => {
  const user = userEvent.setup()
  render(<LanguageProvider><Nav /></LanguageProvider>)
  expect(screen.getByText(/Alfavit/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Boshlash' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'RU' }))
  expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument()
})
