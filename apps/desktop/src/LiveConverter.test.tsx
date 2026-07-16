import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { LiveConverter } from './LiveConverter'

test('typing Cyrillic shows new-Latin output and detected script', async () => {
  const user = userEvent.setup()
  render(<LiveConverter />)
  await user.type(screen.getByRole('textbox'), 'салом')
  expect(screen.getByTestId('output')).toHaveTextContent('salom')
  expect(screen.getByTestId('detected-badge')).toHaveTextContent('Cyrillic')
})

test('converts old-Latin oʻ to ö live', async () => {
  const user = userEvent.setup()
  render(<LiveConverter />)
  await user.type(screen.getByRole('textbox'), 'oʻzbek')
  expect(screen.getByTestId('output')).toHaveTextContent('özbek')
})

test('empty input shows the hint and no output element', () => {
  render(<LiveConverter />)
  expect(screen.queryByTestId('output')).not.toBeInTheDocument()
  expect(screen.getByText(/Type or paste/i)).toBeInTheDocument()
})

test('Copy button writes the output to the clipboard', async () => {
  const user = userEvent.setup()
  render(<LiveConverter />)
  await user.type(screen.getByRole('textbox'), 'чой')
  // Install the spy AFTER userEvent.setup() (which installs its own clipboard stub).
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  await user.click(screen.getByRole('button', { name: /Copy/i }))
  expect(writeText).toHaveBeenCalledWith('çoy')
})
