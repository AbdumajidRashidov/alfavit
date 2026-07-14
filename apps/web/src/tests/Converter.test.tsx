import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Converter } from '../components/Converter'

function renderConverter() {
  return renderWithLocale(<Converter />)
}

test('typing Cyrillic shows new-Latin output and detected script', async () => {
  const user = userEvent.setup()
  renderConverter()
  await user.type(screen.getByRole('textbox'), 'салом')
  await screen.findByText('salom') // wait for debounced conversion
  expect(screen.getByTestId('output')).toHaveTextContent('salom')
  expect(screen.getByTestId('detected-badge')).toHaveTextContent(/Cyrillic|Kirill|Кириллица/)
})

test('Copy button writes output to clipboard', async () => {
  const user = userEvent.setup()
  renderConverter()
  await user.type(screen.getByRole('textbox'), 'чой')
  await screen.findByText('çoy')
  // Install the spy AFTER userEvent.setup() (which installs its own clipboard stub).
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  await user.click(screen.getByRole('button', { name: /Copy|Nusxa|Копировать/ }))
  expect(writeText).toHaveBeenCalledWith('çoy')
})
