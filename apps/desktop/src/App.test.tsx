import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { App } from './App'
import { hidePanel } from './panel'

vi.mock('./panel', () => ({ hidePanel: vi.fn() }))
vi.mock('./liveControl', () => ({
  inTauri: () => false,
  getLiveEnabled: vi.fn().mockResolvedValue(false),
  setLiveEnabled: vi.fn().mockResolvedValue(false),
}))

test('mounts the live-transform switch', async () => {
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
  expect(await screen.findByRole('switch', { name: 'Live transform' })).toBeInTheDocument()
})

test('Escape hides the panel', () => {
  render(<App />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(hidePanel).toHaveBeenCalled()
})
