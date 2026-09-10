import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi, beforeEach } from 'vitest'
import { renderWithLocale, renderApp } from './renderApp'
import { GuideKeyboardPage } from '../pages/GuideKeyboardPage'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('renders the title, five steps and the four letter buttons', () => {
  renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('How to type Ş, Ç, Ö, Ğ')
  expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(5)
  for (const pair of ['Ş ş', 'Ç ç', 'Ö ö', 'Ğ ğ']) expect(screen.getByText(pair)).toBeInTheDocument()
  expect(screen.getByText(/Turkish Q layout is the practical choice/)).toBeInTheDocument()
})

test('clicking a letter copies its lowercase form', async () => {
  const user = userEvent.setup()
  renderWithLocale(<GuideKeyboardPage />, '/en')
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  await user.click(screen.getByRole('button', { name: 'Copy ş' }))
  expect(writeText).toHaveBeenCalledWith('ş')
  expect(screen.getByText('Copied')).toBeInTheDocument()
})

test('is routed under every locale', () => {
  renderApp('/ru/guide/keyboard')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Как набирать буквы Ş, Ç, Ö, Ğ')
})
