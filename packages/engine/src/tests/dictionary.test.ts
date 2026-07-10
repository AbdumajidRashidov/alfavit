import { expect, test } from 'vitest'
import { lookupException } from '../dictionary'

test('returns override for a known exception, preserving lead case', () => {
  // 'цирк' would rule-convert to 'sirk'; dictionary forces 'sirk' explicitly as a demo entry
  expect(lookupException('цирк')).toBe('sirk')
  expect(lookupException('Цирк')).toBe('Sirk')
})

test('returns undefined for unknown words', () => {
  expect(lookupException('салом')).toBeUndefined()
})
