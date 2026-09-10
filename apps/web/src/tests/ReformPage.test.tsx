import { screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { renderWithLocale } from './renderApp'
import { ReformPage } from '../pages/ReformPage'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

test('states the Senate approval and the pending signature', () => {
  renderWithLocale(<ReformPage />, '/en')
  expect(screen.getByText(/approved by the Senate on 10 September 2026/)).toBeInTheDocument()
  expect(screen.getByText('Updated 10 September 2026')).toBeInTheDocument()
})

test('renders the transition timeline', () => {
  renderWithLocale(<ReformPage />, '/en')
  expect(screen.getByText('Timeline')).toBeInTheDocument()
  expect(screen.getByText('10 September 2026')).toBeInTheDocument()
  expect(screen.getByText('2031')).toBeInTheDocument()
})

test('lists four letter changes, the ng note, and no ts→c row', () => {
  renderWithLocale(<ReformPage />, '/en')
  expect(screen.getByText('Ş ş')).toBeInTheDocument()
  expect(screen.queryByText('C c')).not.toBeInTheDocument()
  expect(screen.getByText(/ng is no longer listed/)).toBeInTheDocument()
})

test('uz locale carries the Senate date', () => {
  renderWithLocale(<ReformPage />, '/')
  // The FAQ answer repeats the Senate date, so match the law paragraph's unique wording.
  expect(screen.getByText(/Senat 2026-yil 10-sentabrda maʼqulladi; endi Prezident imzosi kutilmoqda/)).toBeInTheDocument()
})
