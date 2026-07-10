import { expect, test } from 'vitest'
import { version } from '../index'

test('exports a version string', () => {
  expect(typeof version).toBe('string')
})
