import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'
import { S_H_STEMS } from '../dictionary'

const t = (s: string) => transliterate(s).text

test.each([
  ['Ishoq', 'Ishoq'], ["Is'hoq", 'Ishoq'], ['Is’hoq', 'Ishoq'], ['ISHOQ', 'ISHOQ'],
  ['Ishoqning', 'Ishoqning'], ['ishoqqa', 'ishoqqa'], ['Ishoqjon', 'Ishoqjon'],
  ['Mushafni', 'Mushafni'], ['ashob', 'ashob'], ['ishol', 'ishol'], ['tashih', 'tashih'],
])('%s keeps s and h apart', (input, expected) => {
  expect(t(input)).toBe(expected)
})

test('every stem converts the same whatever script it was typed in', () => {
  for (const { cyrillic, oldLatin } of S_H_STEMS) {
    expect(t(oldLatin), oldLatin).toBe(t(cyrillic))
    expect(cyrillic, `${cyrillic} needs сҳ as its source`).toContain('сҳ')
  }
})

test.each([
  ['ishonch', 'işonç'], ['kishi', 'kişi'], ['tashib', 'taşib'],
  ['tashqi', 'taşqi'], ['ishla', 'işla'], ['boshi', 'boşi'],
])('everyday ş-word %s still becomes ş', (input, expected) => {
  expect(t(input)).toBe(expected)
})

test('a list word raises no ambiguity flag', () => {
  expect(transliterate('Ishoq keldi').flags).toEqual([])
})
