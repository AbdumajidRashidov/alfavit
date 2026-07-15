import { expect, test } from 'vitest'
import { convertCyrillicRun } from '../convert-cyrillic'

test('maps unambiguous Cyrillic letters', () => {
  expect(convertCyrillicRun('салом', 0).output).toBe('salom')
  expect(convertCyrillicRun('ўзбек', 0).output).toBe('özbek')
  expect(convertCyrillicRun('чой', 0).output).toBe('çoy')
  expect(convertCyrillicRun('шамол', 0).output).toBe('şamol')
})

test('maps multi-letter Cyrillic vowels', () => {
  expect(convertCyrillicRun('ёзув', 0).output).toBe('yozuv')
})

test('preserves case', () => {
  expect(convertCyrillicRun('Салом', 0).output).toBe('Salom')
})

test('е becomes ye word-initially and flags it', () => {
  const r = convertCyrillicRun('ер', 0)
  expect(r.output).toBe('yer')
  expect(r.flags[0]).toMatchObject({
    start: 0, end: 1, chosen: 'ye', alternatives: ['e'], reason: 'cyrillic-e-position',
  })
})

test('е becomes e after a consonant', () => {
  expect(convertCyrillicRun('мен', 0).output).toBe('men')
})

test('ц defaults to s and flags the alternative c', () => {
  const r = convertCyrillicRun('цех', 0)
  expect(r.output).toBe('sex')
  expect(r.flags[0]).toMatchObject({
    chosen: 's', alternatives: ['c'], reason: 'cyrillic-ts',
  })
})

test('flag positions are absolute with offset', () => {
  const r = convertCyrillicRun('ер', 7)
  expect(r.flags[0]).toMatchObject({ start: 7, end: 8 })
})
