import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'

// oʻ/gʻ use the turned comma ʻ (U+02BB), but Word/Pages autocorrect straight
// quotes to curly ones and people type all sorts of apostrophe-like marks.
// These must still convert — the whole word, not split on the apostrophe.
test('curly and modifier apostrophes in oʻ/gʻ convert to ŏ/ğ', () => {
  expect(transliterate('qo‘ng‘iroq').text).toBe('qŏnğiroq') // ‘ U+2018
  expect(transliterate('bo‘yicha').text).toBe('bŏyiça') //         ‘ U+2018
  expect(transliterate('o’zbek').text).toBe('ŏzbek') //            ’ U+2019
  expect(transliterate('oʼzbek').text).toBe('ŏzbek') //            ʼ U+02BC
  expect(transliterate('o`zbek').text).toBe('ŏzbek') //                 ` U+0060
})

test('a full sentence with curly-quote oʻ/gʻ converts cleanly', () => {
  const out = transliterate('bo‘yicha qo‘ng‘iroqlarni').text
  expect(out).toBe('bŏyiça qŏnğiroqlarni')
})
