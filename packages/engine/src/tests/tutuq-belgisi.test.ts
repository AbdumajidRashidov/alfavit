import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'

// The reformed alphabet has 28 letters + ONE apostrophe sign: the tutuq belgisi
// ʼ (U+02BC). The turned comma ʻ (U+02BB) exists only in the 1995 old-Latin
// input, as part of oʻ and gʻ — and those are consumed into ö/ğ. So U+02BB must
// never appear in engine output.

const TUTUQ = 'ʼ' // ʼ tutuq belgisi — the only apostrophe in the new alphabet
const OKINA = 'ʻ' // ʻ turned comma — old-Latin oʻ/gʻ only, never in output

test('tutuq belgisi in old-Latin input stays the tutuq belgisi U+02BC', () => {
  expect(transliterate("e'tibor").text).toBe(`e${TUTUQ}tibor`)
  expect(transliterate("san'at").text).toBe(`san${TUTUQ}at`)
  expect(transliterate("ma'lumot").text).toBe(`ma${TUTUQ}lumot`)
})

test('already-reformed text with a tutuq belgisi is left unchanged', () => {
  const reformed = `e${TUTUQ}tibor`
  expect(transliterate(reformed).text).toBe(reformed)
})

test('never emits the turned comma U+02BB', () => {
  const inputs = [
    "e'tibor",
    `e${TUTUQ}tibor`,
    `e${OKINA}tibor`,
    "Qur'on",
    "sur'at",
    "E'TIBOR",
    "oʻzbekiston san'ati",
    'эътибор',
    "o'zbek",
    "g'alaba",
  ]
  for (const input of inputs) {
    expect(transliterate(input).text).not.toContain(OKINA)
  }
})

test('oʻ and gʻ still convert when the same word carries a tutuq belgisi', () => {
  expect(transliterate("oʻzbek san'ati").text).toBe(`özbek san${TUTUQ}ati`)
  expect(transliterate("gʻayrat va e'tibor").text).toBe(`ğayrat va e${TUTUQ}tibor`)
})

test('Cyrillic hard sign and old-Latin apostrophe agree on U+02BC', () => {
  expect(transliterate('эътибор').text).toBe(transliterate("e'tibor").text)
})
