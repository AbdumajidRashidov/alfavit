import { expect, test } from 'vitest'
import { transliterate } from '@alfavit/engine'

test('engine is importable and converts', () => {
  expect(transliterate('салом').text).toBe('salom')
})
