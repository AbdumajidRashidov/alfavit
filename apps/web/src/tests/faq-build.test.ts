import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const dist = (p: string) => readFileSync(resolve(__dirname, '../../dist', p), 'utf-8')

test('faq pages carry content + FAQPage schema in all three locales', () => {
  // Root locale is uz, so dist/faq.html is the Uzbek page; en lives at en/faq.html.
  const uz = dist('faq.html')
  expect(uz).toContain('Yangi alifboda nechta harf bor?')
  expect(uz).toContain('Koʻp beriladigan savollar')
  expect(uz).toContain('"@type":"FAQPage"')

  const ru = dist('ru/faq.html')
  expect(ru).toContain('Сколько букв в новом алфавите?')
  expect(ru).toContain('"@type":"FAQPage"')

  const en = dist('en/faq.html')
  expect(en).toContain('How many letters are in the new alphabet?')
  expect(en).toContain('"@type":"FAQPage"')
})
