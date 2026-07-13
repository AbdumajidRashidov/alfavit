import { expect, test } from 'vitest'
import { toNewLatin } from '../convert'

test('toNewLatin converts Cyrillic and old-Latin', () => {
  expect(toNewLatin('салом дунё')).toBe('salom dunyo')
  expect(toNewLatin("o'zbek")).toBe('ŏzbek')
  expect(toNewLatin('Ўзбекча: шаҳар, чой')).toBe('Ŏzbekça: şahar, çoy')
})
