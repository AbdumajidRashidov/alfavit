import { screen, act } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useT } from '../i18n/useT'
import { renderWithLocale } from './renderApp'

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

test('root path is uz and shows uz strings', () => {
  renderWithLocale(<Probe />, '/')
  expect(screen.getByTestId('locale')).toHaveTextContent('uz')
  expect(screen.getByTestId('cta')).toHaveTextContent('Boshlash')
})

test('/ru path is ru and shows ru strings', () => {
  renderWithLocale(<Probe />, '/ru')
  expect(screen.getByTestId('locale')).toHaveTextContent('ru')
  expect(screen.getByTestId('cta')).toHaveTextContent('Начать')
})

test('setLocale navigates to the same page in the new locale', () => {
  renderWithLocale(<Probe />, '/')
  act(() => { screen.getByText('ru').click() })
  expect(screen.getByTestId('locale')).toHaveTextContent('ru')
  expect(screen.getByTestId('cta')).toHaveTextContent('Начать')
})
