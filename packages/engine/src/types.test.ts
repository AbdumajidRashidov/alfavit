import { expect, test } from 'vitest'
import { emptyResult } from './types'

test('emptyResult returns an empty, well-formed result', () => {
  const r = emptyResult()
  expect(r).toEqual({ text: '', segments: [], flags: [] })
})
