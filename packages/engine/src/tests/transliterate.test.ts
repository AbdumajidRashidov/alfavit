import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'

test('converts a mixed-script sentence and preserves foreign runs', () => {
  const r = transliterate('салом, dunyo 2026')
  expect(r.text).toBe('salom, dunyo 2026')
})

test('converts old-Latin input', () => {
  expect(transliterate("o'zbek tili").text).toBe('ŏzbek tili')
})

test('collects ambiguity flags from Cyrillic runs', () => {
  const r = transliterate('ер')
  expect(r.flags).toHaveLength(1)
  expect(r.flags[0].reason).toBe('cyrillic-e-position')
})

test('segments carry source, output, and script', () => {
  const r = transliterate('чой')
  expect(r.segments).toEqual([
    { source: 'чой', output: 'çoy', script: 'cyrillic', start: 0, end: 3 },
  ])
})

test('empty input yields an empty result', () => {
  expect(transliterate('')).toEqual({ text: '', segments: [], flags: [] })
})

test('applies dictionary override for a word embedded in a sentence', () => {
  const r = transliterate('мен цирк кўрдим')
  expect(r.text).toContain('sirk')
  expect(r.text).toBe('men sirk kŏrdim')
})
