import { expect, test } from 'vitest'
import { transliterate } from '@alfavit/engine'
import { KEY_TABLE } from '../index.js'
import { NEW_ALPHABET_WORDS } from './fixtures/newAlphabetWords.js'

const outputs = new Set(KEY_TABLE.flatMap((k) => [k.lower, k.upper]))

test('the table is exactly the five characters, in the reform order', () => {
  expect(KEY_TABLE.map((k) => [k.base, k.lower, k.upper])).toEqual([
    ['o', 'ö', 'Ö'], ['g', 'ğ', 'Ğ'], ['s', 'ş', 'Ş'], ['c', 'ç', 'Ç'], ["'", 'ʼ', 'ʼ'],
  ])
})

test('every new-alphabet character the engine can emit has a key, and nothing more', () => {
  const cyr = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯЎҚҒҲ'
  const input = [cyr, cyr.toLowerCase(), 'oʻ gʻ sh ch Oʻ Gʻ Sh Ch OʻZBEK SHAHAR CHOY maʻno ŏ Ŏ'].join(' ')
  const emitted = new Set([...transliterate(input).text].filter((c) => c > '\u007F' && /[\p{Script=Latin}ʼ]/u.test(c)))
  expect(emitted).toEqual(outputs)
})

test.each(NEW_ALPHABET_WORDS)('round trip: %s comes back unchanged', (word) => {
  expect(transliterate(word).text).toBe(word)
})

// Spec, "Known engine edge": the normaliser folds U+02BC into U+02BB, so o+ʼ
// becomes ö. Logged for the next engine release. When this test fails, the
// engine has been fixed — delete it and the spec section together.
test('known edge: o followed by ʼ comes back as ö', () => {
  expect(transliterate('oʼ').text).toBe('ö')
})
