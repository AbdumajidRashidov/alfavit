import { expect, test } from 'vitest'
import { convertOldLatin } from '../convert-old-latin'

test('converts 1995 digraphs to reform letters', () => {
  expect(convertOldLatin('shamol')).toBe('şamol')
  expect(convertOldLatin('choy')).toBe('çoy')
})

test('converts apostrophe letters', () => {
  expect(convertOldLatin("o'zbek")).toBe('ŏzbek')
  expect(convertOldLatin("g'alaba")).toBe('ğalaba')
})

test('preserves case', () => {
  expect(convertOldLatin('Shamol')).toBe('Şamol')
  expect(convertOldLatin("O'zbek")).toBe('Ŏzbek')
})
