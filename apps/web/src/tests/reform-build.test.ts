import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const dist = (p: string) => readFileSync(resolve(__dirname, '../../dist', p), 'utf-8')

test('reform page has spotlight anchors + Article schema', () => {
  const html = dist('reform.html')
  expect(html).toContain('id="sh"')
  expect(html).toContain('id="oh"')
  expect(html).not.toContain('id="ts"')
  expect(html).toContain('"@type":"Article"')
  expect(html).toContain('şahar')
  expect(html).toContain('Senat')
})

test('reform page carries the FAQ section + FAQPage schema', () => {
  const html = dist('reform.html')
  expect(html).toContain('Yangi alifboda nechta harf bor?')
  expect(html).toContain('"@type":"FAQPage"')
})
