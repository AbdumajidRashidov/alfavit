import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const distPath = (p: string) => resolve(__dirname, '../../dist', p)
const dist = (p: string) => readFileSync(distPath(p), 'utf-8')

test('cyrillic guide built for uz + ru with HowTo schema', () => {
  const uz = dist('guide/cyrillic-to-latin.html')
  expect(uz).toContain('Kirill alifbosidan yangi lotinga')
  expect(uz).toContain('"@type":"HowTo"')
  expect(dist('ru/guide/cyrillic-to-latin.html')).toContain('Конвертация с кириллицы')
})

test('old-latin guide built for uz + ru', () => {
  expect(dist('guide/old-latin-to-new.html')).toContain('Eski (1995) lotindan')
  expect(dist('ru/guide/old-latin-to-new.html')).toContain('латиницы')
})

test('guides are NOT built for en', () => {
  expect(existsSync(distPath('en/guide/cyrillic-to-latin.html'))).toBe(false)
  expect(existsSync(distPath('en/guide/old-latin-to-new.html'))).toBe(false)
})
