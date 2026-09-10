import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

test('dist/sitemap.xml has all 30 locale URLs', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  expect((xml.match(/<loc>/g) ?? []).length).toBe(30)
  expect(xml).toContain('<loc>https://alfavit.uz/ru/files</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/en/alphabet</loc>')
  expect(xml).toContain('hreflang="x-default"')
})

test('dist/llms.txt and robots.txt are present', () => {
  const llms = readFileSync(resolve(__dirname, '../../dist/llms.txt'), 'utf-8')
  expect(llms).toContain('# Alfavit')
  const robots = readFileSync(resolve(__dirname, '../../dist/robots.txt'), 'utf-8')
  expect(robots).toContain('GPTBot')
  expect(robots).toContain('Sitemap: https://alfavit.uz/sitemap.xml')
})
