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

test('dist/sitemap.xml declares the chart image on every alphabet URL', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
  // One per locale, and only on the alphabet pages.
  expect((xml.match(/<image:loc>/g) ?? []).length).toBe(3)
  expect(xml).toContain('<image:loc>https://alfavit.uz/chart/lotin-alifbosi-jadvali-2026.png</image:loc>')
  expect(xml).toContain('<image:loc>https://alfavit.uz/chart/uzbekskiy-alfavit-2026.png</image:loc>')
})

test('every sitemap URL carries a lastmod, and none points at the 404', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  expect((xml.match(/<lastmod>/g) ?? []).length).toBe(30)
  // An inaccurate or missing lastmod makes Google stop trusting the file.
  for (const d of xml.match(/<lastmod>([^<]+)<\/lastmod>/g) ?? []) {
    const date = d.replace(/<\/?lastmod>/g, '')
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(date).getTime()).not.toBeNaN()
  }
  expect(xml).not.toContain('/404')
})

test('priority follows search value: /alphabet outranks /files', () => {
  const xml = readFileSync(resolve(__dirname, '../../dist/sitemap.xml'), 'utf-8')
  const priorityOf = (loc: string) =>
    Number(
      new RegExp(`<loc>${loc}</loc>[\\s\\S]*?<priority>([\\d.]+)</priority>`).exec(xml)?.[1] ?? '0',
    )
  expect(priorityOf('https://alfavit.uz/alphabet')).toBeGreaterThan(
    priorityOf('https://alfavit.uz/files'),
  )
  expect(priorityOf('https://alfavit.uz/reform')).toBeGreaterThan(
    priorityOf('https://alfavit.uz/developers'),
  )
})

test('dist/llms.txt states when it was last updated and that the law is unsigned', () => {
  const llms = readFileSync(resolve(__dirname, '../../dist/llms.txt'), 'utf-8')
  expect(llms).toMatch(/Last updated: \d{4}-\d{2}-\d{2}/)
  expect(llms).toContain('passed but not yet in force')
})
