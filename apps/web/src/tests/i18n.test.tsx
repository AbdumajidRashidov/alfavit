import { render, screen, act } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { useT } from '../i18n/useT'

function Probe() {
  const { t, locale, setLocale } = useT()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="cta">{t('nav.cta')}</span>
      <button onClick={() => setLocale('ru')}>ru</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
  // Force a non-uz/ru/en browser language so we exercise the Uzbek fallback.
  Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true })
})

test('defaults to uz (fallback) and shows uz strings', () => {
  render(<LanguageProvider><Probe /></LanguageProvider>)
  expect(screen.getByTestId('locale')).toHaveTextContent('uz')
  expect(screen.getByTestId('cta')).toHaveTextContent('Boshlash')
})

test('setLocale switches strings and persists', () => {
  render(<LanguageProvider><Probe /></LanguageProvider>)
  act(() => { screen.getByText('ru').click() })
  expect(screen.getByTestId('locale')).toHaveTextContent('ru')
  expect(screen.getByTestId('cta')).toHaveTextContent('Начать')
  expect(localStorage.getItem('alfavit.locale')).toBe('ru')
})
