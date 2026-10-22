import { expect, test } from 'vitest'
import { transliterate } from '@alfavit/engine'
import { renderWithLocale } from './renderApp'
import { TRICKY_GROUPS, TRICKY_EXPECTED } from '../content/guides/trickyCases'
import { GuideTrickyCasesPage } from '../pages/GuideTrickyCasesPage'

// The page renders the engine's own output, so it can't drift from the
// converter; this pins that output, so a change shows up here before deploy.
test('every case shows what the engine does today', () => {
  for (const { inputs } of TRICKY_GROUPS) {
    for (const input of inputs) expect(transliterate(input).text, input).toBe(TRICKY_EXPECTED[input])
  }
})

test('the page renders every input as typed, next to its output', () => {
  const { container } = renderWithLocale(<GuideTrickyCasesPage />, '/en')
  const rows = [...container.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent))
  const all = TRICKY_GROUPS.flatMap((g) => g.inputs)
  expect(rows).toHaveLength(all.length)
  for (const input of all) expect(rows).toContainEqual([input, TRICKY_EXPECTED[input]])
})

test('no competitor and no "rule" claim', () => {
  const { container } = renderWithLocale(<GuideTrickyCasesPage />, '/en')
  expect(container.textContent).not.toMatch(/alifbochi|tadqiq|translit\.uz|uzoffice|rule/i)
})
