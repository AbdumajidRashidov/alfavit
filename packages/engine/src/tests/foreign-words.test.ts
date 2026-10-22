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
