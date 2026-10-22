import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from './renderApp'

test('/kirill is a Cyrillic page with the converter', () => {
  const { container } = renderApp('/kirill')
  expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/[Ѐ-ӿ]/)
  expect(container.querySelector('#converter-input')).not.toBeNull()
  expect(screen.getAllByText(/2027/).length).toBeGreaterThan(0)
})

test.each(['/ru/kirill', '/en/kirill'])('%s is not a page', (path) => {
  renderApp(path)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/404|not found|topilmadi|не найдена/i)
})

// /kirill exists only at the root; a locale-prefixed link would be a 404.
test.each(['/alphabet', '/ru/alphabet', '/en/alphabet'])('%s links to /kirill without a locale prefix', (path) => {
  const { container } = renderApp(path)
  expect(container.querySelector('a[href="/kirill"]')).not.toBeNull()
})
