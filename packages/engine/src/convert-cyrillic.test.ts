import { expect, test } from 'vitest'
import { convertCyrillicRun } from './convert-cyrillic'

test('maps unambiguous Cyrillic letters', () => {
  expect(convertCyrillicRun('салом', 0).output).toBe('salom')
  expect(convertCyrillicRun('ўзбек', 0).output).toBe('ŏzbek')
  expect(convertCyrillicRun('чой', 0).output).toBe('çoy')
  expect(convertCyrillicRun('шамол', 0).output).toBe('şamol')
})

test('maps multi-letter Cyrillic vowels', () => {
  expect(convertCyrillicRun('ёзув', 0).output).toBe('yozuv')
})

test('preserves case', () => {
  expect(convertCyrillicRun('Салом', 0).output).toBe('Salom')
})
