import { expect, test } from 'vitest'
import { localePath, parsePath, generateSitemapXml, SITE_URL, PAGE_PATHS, LOCALES } from '../seo/config'

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

test('generateSitemapXml: 18 urls with hreflang alternates', () => {
  const xml = generateSitemapXml()
  expect((xml.match(/<loc>/g) ?? []).length).toBe(LOCALES.length * PAGE_PATHS.length) // 18
  expect(xml).toContain(`<loc>${SITE_URL}/ru/files</loc>`)
  expect(xml).toContain(`<loc>${SITE_URL}/en/reform</loc>`)
  expect(xml).toContain('hreflang="x-default"')
  expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
})
