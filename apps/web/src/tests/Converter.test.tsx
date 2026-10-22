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

// The compact variant sits on /alphabet, where most search visitors land and
// 80% of what people convert is old Latin, so its empty state shows an
// old-Latin example and what it becomes.
test('compact: before anything is typed, shows an old-Latin example and its new-Latin result', () => {
  renderWithLocale(<Converter compact />)
  expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Oʻzbekiston, Toshkent, choʻl, togʻ')
  expect(screen.getByTestId('output')).toHaveTextContent('Özbekiston, Toşkent, çöl, toğ')
})

test('compact: the example gives way to the real conversion once typing starts', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Converter compact />)
  await user.type(screen.getByRole('textbox'), 'чой')
  await screen.findByText('çoy')
  expect(screen.getByTestId('output')).not.toHaveTextContent('Özbekiston')
})

test('the home converter keeps its generic placeholder and an empty output', () => {
  renderWithLocale(<Converter />)
  expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Matn kiriting…')
  expect(screen.getByTestId('output')).toBeEmptyDOMElement()
})

// On a 360px phone the home layout's header rows wrap once the detected-script
// note and the Share button appear, pushing the boxes down mid-typing. In the
// compact card, whatever appears on typing goes below the box it belongs to.
test('compact: what appears on typing sits below the boxes, never above them', async () => {
  const user = userEvent.setup()
  renderWithLocale(<Converter compact />)
  await user.type(screen.getByRole('textbox'), 'чой')
  await screen.findByText('çoy')
  const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  expect(follows(screen.getByRole('textbox'), screen.getByTestId('detected-badge'))).toBe(true)
  expect(follows(screen.getByTestId('output'), screen.getByRole('link', { name: /Share|Ulashish|Поделиться/ }))).toBe(true)
  expect(follows(screen.getByTestId('output'), screen.getByRole('button', { name: /Copy|Nusxa|Копировать/ }))).toBe(true)
})
