import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderWithLocale } from './renderApp'
import { Converter, telegramShareHref } from '../components/Converter'

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

test('Share link appears with output and opens Telegram share with the text', async () => {
  const user = userEvent.setup()
  renderConverter()
  expect(screen.queryByRole('link', { name: /Share|Ulashish|Поделиться/ })).not.toBeInTheDocument()
  await user.type(screen.getByRole('textbox'), 'чой')
  await screen.findByText('çoy')
  const link = screen.getByRole('link', { name: /Share|Ulashish|Поделиться/ })
  expect(link).toHaveAttribute('href', telegramShareHref('çoy'))
  expect(link.getAttribute('href')).toContain('https://t.me/share/url?url=')
  expect(link.getAttribute('href')).toContain(encodeURIComponent('çoy'))
  expect(link).toHaveAttribute('target', '_blank')
})
