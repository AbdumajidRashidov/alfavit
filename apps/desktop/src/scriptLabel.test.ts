import { expect, test } from 'vitest'
import { scriptLabel } from './scriptLabel'

test('maps engine SourceScript values to display labels', () => {
  expect(scriptLabel('cyrillic')).toBe('Cyrillic')
  expect(scriptLabel('old-latin')).toBe('Old Latin')
  expect(scriptLabel('foreign')).toBe('—')
})
