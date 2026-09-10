import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const dist = (p: string) => readFileSync(resolve(__dirname, '../../dist', p), 'utf-8')

test('cyrillic guide built for uz + ru + en with HowTo schema', () => {
  const uz = dist('guide/cyrillic-to-latin.html')
  expect(uz).toContain('Kirill alifbosidan yangi lotinga')
  expect(uz).toContain('"@type":"HowTo"')
  expect(dist('ru/guide/cyrillic-to-latin.html')).toContain('Конвертация с кириллицы')
  expect(dist('en/guide/cyrillic-to-latin.html')).toContain('Convert Cyrillic to the new Latin')
})

test('keyboard guide built for uz + ru + en with HowTo schema', () => {
  const uz = dist('guide/keyboard.html')
  expect(uz).toContain('Ş, Ç, Ö, Ğ harflarini qanday yozish')
  expect(uz).toContain('"@type":"HowTo"')
  expect(dist('ru/guide/keyboard.html')).toContain('Как набирать буквы Ş, Ç, Ö, Ğ')
  expect(dist('en/guide/keyboard.html')).toContain('How to type Ş, Ç, Ö, Ğ')
})

test('old-latin guide built for uz + ru + en', () => {
  expect(dist('guide/old-latin-to-new.html')).toContain('Eski (1995) lotindan')
  expect(dist('ru/guide/old-latin-to-new.html')).toContain('латиницы')
  expect(dist('en/guide/old-latin-to-new.html')).toContain('Old Latin (1995) to the new Latin')
})
