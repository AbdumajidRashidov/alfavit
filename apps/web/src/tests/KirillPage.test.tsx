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

// Review of 192c486: the page's own tool spoke Latin on a page for Cyrillic readers,
// and the letters table read as if the Cyrillic letters had changed.
test('/kirill speaks Cyrillic inside the converter too', () => {
  const { container } = renderApp('/kirill')
  expect(container.querySelector('#converter-heading')!.textContent).toMatch(/[Ѐ-ӿ]/)
  expect(container.querySelector('#converter-input')!.getAttribute('placeholder')).toMatch(/[Ѐ-ӿ]/)
  expect(container.querySelector('label[for="converter-input"]')!.textContent).toMatch(/[Ѐ-ӿ]/)
})

test('/kirill letters table shows Cyrillic, the 1995 Latin and the new Latin, with column headers', () => {
  const { container } = renderApp('/kirill')
  const table = container.querySelector('table')!
  const heads = table.querySelectorAll('thead th')
  expect(heads).toHaveLength(3)
  heads.forEach((th) => expect(th.getAttribute('scope')).toBe('col'))
  expect(table.textContent).toContain('Oʻ oʻ')
  const labelledBy = table.getAttribute('aria-labelledby')!
  expect(container.querySelector(`#${labelledBy}`)?.tagName).toBe('H2')
})
