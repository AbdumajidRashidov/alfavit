import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from '../App'

test('App renders a main landmark', () => {
  render(<App />)
  expect(screen.getByTestId('app-root')).toBeInTheDocument()
})
