import { expect, test } from 'vitest'
import { computeVideoOpacity } from '../hooks/useVideoLoop'

test('ramps in, holds, ramps out', () => {
  expect(computeVideoOpacity(0, 10, 0.5)).toBeCloseTo(0, 5)
  expect(computeVideoOpacity(0.25, 10, 0.5)).toBeCloseTo(0.5, 5)
  expect(computeVideoOpacity(5, 10, 0.5)).toBeCloseTo(1, 5)
  expect(computeVideoOpacity(9.75, 10, 0.5)).toBeCloseTo(0.5, 5)
  expect(computeVideoOpacity(10, 10, 0.5)).toBeCloseTo(0, 5)
})

test('degenerate duration returns 1', () => {
  expect(computeVideoOpacity(0, 0, 0.5)).toBe(1)
  expect(computeVideoOpacity(3, Number.NaN, 0.5)).toBe(1)
})
