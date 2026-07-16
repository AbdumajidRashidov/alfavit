import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { App } from './App'
import { hidePanel } from './panel'

vi.mock('./panel', () => ({ hidePanel: vi.fn() }))

test('mounts the live converter', () => {
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

test('Escape hides the panel', () => {
  render(<App />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(hidePanel).toHaveBeenCalled()
})
