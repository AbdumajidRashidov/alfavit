import { expect, test } from 'vitest'
import { transformWord } from './liveTransform'

test('transformWord converts old-Latin and Cyrillic to reformed new-Latin', () => {
  expect(transformWord('shahar')).toBe('şahar')
  expect(transformWord('oʻzbek')).toBe('özbek')
  expect(transformWord('чой')).toBe('çoy')
})

test('transformWord leaves foreign words unchanged', () => {
  expect(transformWord('hello')).toBe('hello')
})

// Reported from the wild (2026-09-10): live transform typed the turned comma
// ʻ (U+02BB) instead of the tutuq belgisi ʼ (U+02BC) in every word carrying an
// apostrophe. U+02BB is not in the reformed alphabet at all.
test('transformWord types the tutuq belgisi ʼ (U+02BC), never the turned comma ʻ (U+02BB)', () => {
  expect(transformWord("e'tibor")).toBe('eʼtibor')
  expect(transformWord('eʼtibor')).toBe('eʼtibor')
  expect(transformWord("san'at")).toBe('sanʼat')
  expect(transformWord("e'tibor")).not.toContain('ʻ')
})
