import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    </MemoryRouter>,
  )
}

test('all-locale page shows UZ/RU/EN', () => {
  at('/reform')
  expect(screen.getByRole('button', { name: 'UZ' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'RU' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
})

test('uz/ru-only guide page hides EN', () => {
  at('/guide/cyrillic-to-latin')
  expect(screen.getByRole('button', { name: 'UZ' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'RU' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'EN' })).toBeNull()
})
