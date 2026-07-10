import { expect, test } from 'vitest'
import { normalizeApostrophes } from '../normalize'

test('folds apostrophe variants to U+02BB', () => {
  // ASCII apostrophe
  expect(normalizeApostrophes("o'g'")).toBe('oʻgʻ')
  // U+2018 and U+2019 (left/right single quotation marks)
  expect(normalizeApostrophes("o'g'")).toBe('oʻgʻ')
  // U+02BC (modifier letter apostrophe)
  expect(normalizeApostrophes("oʼgʼ")).toBe('oʻgʻ')
})

test('leaves already-canonical text unchanged', () => {
  expect(normalizeApostrophes('oʻgʻ')).toBe('oʻgʻ')
})
