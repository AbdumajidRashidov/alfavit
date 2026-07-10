import { expect, test } from 'vitest'
import { detectScript, segment } from './detect'

test('detectScript picks the dominant letter script', () => {
  expect(detectScript('салом')).toBe('cyrillic')
  expect(detectScript('salom')).toBe('old-latin')
  expect(detectScript('12:30 —')).toBe('foreign')
})

test('segment splits into script runs with correct indices', () => {
  const runs = segment('салом, salom')
  expect(runs).toEqual([
    { text: 'салом', script: 'cyrillic', start: 0, end: 5 },
    { text: ', ', script: 'foreign', start: 5, end: 7 },
    { text: 'salom', script: 'old-latin', start: 7, end: 12 },
  ])
})
