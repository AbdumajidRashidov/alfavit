import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { FileConverter } from '../components/FileConverter'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
  // jsdom has no object-URL / real downloads
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

function renderFC() {
  return renderWithLocale(<FileConverter />, '/en')
}

test('converts a supported .txt file and reports done', async () => {
  const user = userEvent.setup()
  renderFC()
  const file = new File(['салом'], 'note.txt', { type: 'text/plain' })
  await user.upload(screen.getByTestId('file-input'), file)
  await user.click(screen.getByRole('button', { name: /Convert/i }))
  expect(await screen.findByText(/Done/i)).toBeInTheDocument()
  expect(URL.createObjectURL).toHaveBeenCalled()
})

test('shows a message for unsupported files', async () => {
  // applyAccept: false so the .pdf isn't filtered by the input's accept attr
  // (drag-drop can bypass accept in real browsers, so this path is reachable).
  const user = userEvent.setup({ applyAccept: false })
  renderFC()
  const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
  await user.upload(screen.getByTestId('file-input'), file)
  await user.click(screen.getByRole('button', { name: /Convert/i }))
  expect(await screen.findByText(/Unsupported/i)).toBeInTheDocument()
})
