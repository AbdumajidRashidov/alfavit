import { expect, test } from 'vitest'
import { transliterate } from '../index'

// Verified input↔output pairs. Extend as the exception dictionary grows.
const CORPUS: Array<[string, string]> = [
  ['салом дунё', 'salom dunyo'],
  ["o'zbekiston", 'özbekiston'],
  ['shahar', 'şahar'],
  ['Тошкент', 'Toşkent'],
  ['12:30 — vaqt', '12:30 — vaqt'],
  ['Ёзув', 'Yozuv'],
  ['Ер', 'Yer'],
  ['Япония', 'Yaponiya'],
  ["e'tibor", 'eʼtibor'], //  tutuq belgisi stays U+02BC, never U+02BB
  ['эътибор', 'eʼtibor'], //  the Cyrillic hard sign lands on the same sign
]

test.each(CORPUS)('golden: %s → %s', (input, expected) => {
  expect(transliterate(input).text).toBe(expected)
})

test('idempotent on already-new-Latin text', () => {
  const once = transliterate('özbekiston').text
  expect(transliterate(once).text).toBe(once)
})
