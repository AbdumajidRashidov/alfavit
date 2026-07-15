import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'

// oʻ/gʻ use the turned comma ʻ (U+02BB), but Word/Pages autocorrect straight
// quotes to curly ones and people type all sorts of apostrophe-like marks.
// These must still convert — the whole word, not split on the apostrophe.
test('curly and modifier apostrophes in oʻ/gʻ convert to ö/ğ', () => {
  expect(transliterate('qo‘ng‘iroq').text).toBe('qönğiroq') // ‘ U+2018
  expect(transliterate('bo‘yicha').text).toBe('böyiça') //         ‘ U+2018
  expect(transliterate('o’zbek').text).toBe('özbek') //            ’ U+2019
  expect(transliterate('oʼzbek').text).toBe('özbek') //            ʼ U+02BC
  expect(transliterate('o`zbek').text).toBe('özbek') //                 ` U+0060
})

test('a full sentence with curly-quote oʻ/gʻ converts cleanly', () => {
  const out = transliterate('bo‘yicha qo‘ng‘iroqlarni').text
  expect(out).toBe('böyiça qönğiroqlarni')
})

// The 2026 reform letter for oʻ is ö (diaeresis), not the 2021-draft breve ŏ.
test('oʻ converts to ö (diaeresis); legacy breve ŏ self-heals to ö', () => {
  expect(transliterate('oʻzbek').text).toBe('özbek')
  expect(transliterate('Oʻzbek').text).toBe('Özbek')
  expect(transliterate('ŏzbek').text).toBe('özbek') // legacy breve → ö
  expect(transliterate('Ŏzbek').text).toBe('Özbek')
})
