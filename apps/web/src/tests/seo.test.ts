import { expect, test } from 'vitest'
import { localePath, parsePath, generateSitemapXml, SITE_URL, PAGE_PATHS, LOCALES, localesForPath } from '../seo/config'

test('localePath: uz has no prefix, ru/en do', () => {
  expect(localePath('uz', '')).toBe('/')
  expect(localePath('uz', 'files')).toBe('/files')
  expect(localePath('ru', '')).toBe('/ru')
  expect(localePath('ru', 'files')).toBe('/ru/files')
  expect(localePath('en', 'reform')).toBe('/en/reform')
})

test('parsePath: derives locale and bare page path', () => {
  expect(parsePath('/')).toEqual({ locale: 'uz', pagePath: '' })
  expect(parsePath('/files')).toEqual({ locale: 'uz', pagePath: 'files' })
  expect(parsePath('/ru')).toEqual({ locale: 'ru', pagePath: '' })
  expect(parsePath('/ru/')).toEqual({ locale: 'ru', pagePath: '' })
  expect(parsePath('/ru/files')).toEqual({ locale: 'ru', pagePath: 'files' })
  expect(parsePath('/en/reform')).toEqual({ locale: 'en', pagePath: 'reform' })
  expect(parsePath('/unknown')).toEqual({ locale: 'uz', pagePath: 'unknown' })
})

test('generateSitemapXml: one url per page per locale it supports', () => {
  const xml = generateSitemapXml()
  const expectedCount = PAGE_PATHS.reduce((sum, p) => sum + p.locales.length, 0)
  expect((xml.match(/<loc>/g) ?? []).length).toBe(expectedCount)
  expect(xml).toContain(`<loc>${SITE_URL}/ru/files</loc>`)
  expect(xml).toContain(`<loc>${SITE_URL}/en/reform</loc>`)
  expect(xml).toContain('hreflang="x-default"')
  expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
})

test('localesForPath: all current pages exist in all three locales', () => {
  expect(localesForPath('')).toEqual(['uz', 'ru', 'en'])
  expect(localesForPath('guide/cyrillic-to-latin')).toEqual(['uz', 'ru', 'en'])
  expect(localesForPath('unknown')).toEqual(['uz', 'ru', 'en'])
})

test('sitemap includes all locales for guides', () => {
  const xml = generateSitemapXml()
  expect(xml).toContain('<loc>https://alfavit.uz/guide/cyrillic-to-latin</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/ru/guide/cyrillic-to-latin</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/en/guide/cyrillic-to-latin</loc>')
})
