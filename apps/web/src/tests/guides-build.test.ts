import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { keyboard } from '../content/guides/keyboard'
import { cyrillicToLatin } from '../content/guides/cyrillicToLatin'
import { oldLatinToNew } from '../content/guides/oldLatinToNew'

const dist = (p: string) => readFileSync(resolve(__dirname, '../../dist', p), 'utf-8')

test('cyrillic guide built for uz + ru + en with HowTo schema', () => {
  const uz = dist('guide/cyrillic-to-latin.html')
  expect(uz).toContain(cyrillicToLatin.uz.title)
  expect(uz).toContain('"@type":"HowTo"')
  expect(uz).toContain('id="converter-input"') // the converter is prerendered, not client-only
  expect(dist('ru/guide/cyrillic-to-latin.html')).toContain(cyrillicToLatin.ru.title)
  expect(dist('en/guide/cyrillic-to-latin.html')).toContain(cyrillicToLatin.en.title)
})

test('keyboard guide built for uz + ru + en with HowTo schema', () => {
  const uz = dist('guide/keyboard.html')
  expect(uz).toContain(keyboard.uz.title)
  expect(uz).toContain('"@type":"HowTo"')
  expect(dist('ru/guide/keyboard.html')).toContain(keyboard.ru.title)
  expect(dist('en/guide/keyboard.html')).toContain(keyboard.en.title)
})

test('old-latin guide built for uz + ru + en', () => {
  expect(dist('guide/old-latin-to-new.html')).toContain(oldLatinToNew.uz.title)
  expect(dist('ru/guide/old-latin-to-new.html')).toContain(oldLatinToNew.ru.title)
  expect(dist('en/guide/old-latin-to-new.html')).toContain(oldLatinToNew.en.title)
})
