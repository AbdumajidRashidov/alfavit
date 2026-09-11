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
  expect(screen.getByTestId('live-hint')).toHaveTextContent(/System Settings → Accessibility/)
})

test('on Windows the failure hint does not mention macOS Accessibility', async () => {
  const ua = navigator.userAgent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/128.0',
    configurable: true,
  })
  try {
    vi.mocked(control.setLiveEnabled).mockResolvedValue(false)
    const user = userEvent.setup()
    render(<LiveToggle />)
    await user.click(await screen.findByRole('switch', { name: 'Live transform' }))
    const hint = screen.getByTestId('live-hint')
    expect(hint).toHaveTextContent("Couldn't start live transform. Try again or restart Alfavit.")
    expect(hint).not.toHaveTextContent(/Accessibility/)
  } finally {
    Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })
  }
})
