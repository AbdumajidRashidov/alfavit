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
