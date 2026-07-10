import { expect, test } from 'vitest'
import { applyCase } from './case'

test('applyCase matches the source lead char casing', () => {
  expect(applyCase('ş', 's')).toBe('ş')
  expect(applyCase('ş', 'S')).toBe('Ş')
})
