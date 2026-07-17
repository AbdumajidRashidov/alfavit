import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { LiveToggle } from './LiveToggle'
import * as control from './liveControl'

vi.mock('./liveControl', () => ({
  inTauri: () => true,
  getLiveEnabled: vi.fn().mockResolvedValue(false),
  setLiveEnabled: vi.fn(),
}))

test('renders an off switch and turns on when toggled', async () => {
  vi.mocked(control.setLiveEnabled).mockResolvedValue(true)
  const user = userEvent.setup()
  render(<LiveToggle />)
  const sw = await screen.findByRole('switch', { name: 'Live transform' })
  expect(sw).toHaveAttribute('aria-checked', 'false')
  await user.click(sw)
  expect(control.setLiveEnabled).toHaveBeenCalledWith(true)
  expect(sw).toHaveAttribute('aria-checked', 'true')
})

test('shows the permission hint when enabling fails', async () => {
  vi.mocked(control.setLiveEnabled).mockResolvedValue(false)
  const user = userEvent.setup()
  render(<LiveToggle />)
  const sw = await screen.findByRole('switch', { name: 'Live transform' })
  await user.click(sw)
  expect(screen.getByTestId('live-hint')).toBeInTheDocument()
})
