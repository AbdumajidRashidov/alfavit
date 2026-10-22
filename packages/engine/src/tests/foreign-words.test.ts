import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'

const t = (s: string) => transliterate(s).text

test('words with w or a bare c are left as written, with the converted form offered', () => {
  const r = transliterate('Washington va Chicago shahar')
  expect(r.text).toBe('Washington va Chicago şahar')
  expect(r.flags).toEqual([
    { start: 0, end: 10, chosen: 'Washington', alternatives: ['Waşington'], reason: 'foreign-word' },
    { start: 14, end: 21, chosen: 'Chicago', alternatives: ['Çicago'], reason: 'foreign-word' },
  ])
})

test('no flag when converting would change nothing', () => {
  expect(transliterate('Facebook').flags).toEqual([])
})

test('ch in an Uzbek word is still ç', () => {
  expect(t('choy')).toBe('çoy')
})

test('foreign names without w or a bare c are still converted until the spelling rules are out (E3)', () => {
  expect(t('Shakespeare')).toBe('Şakespeare')
})

// Review of 049926c: a foreign word with an Uzbek suffix kept the suffix's
// apostrophe as written, so U+02BB and ’ reached the output.
test.each([
  ['Facebook’da', 'Facebookʼda'],
  ['Twitterʻda', 'Twitterʼda'],
  ['Washington’da', 'Washingtonʼda'],
])('%s: the suffix after a foreign word still converts', (input, expected) => {
  expect(t(input)).toBe(expected)
  expect(t(input)).not.toContain('ʻ')
})

test('the flag covers the foreign word, not its suffix, and an apostrophe alone raises none', () => {
  expect(transliterate('Washington’da').flags).toEqual([
    { start: 0, end: 10, chosen: 'Washington', alternatives: ['Waşington'], reason: 'foreign-word' },
  ])
  expect(transliterate('Facebookʻda').flags).toEqual([])
})
