import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

// Requires `pnpm --dir apps/web build` to have run (see the step below).
const dist = (p: string) => readFileSync(resolve(__dirname, '../../dist', p), 'utf-8')

// Note: react-helmet-async (used internally by vite-react-ssg's <Head>) injects a
// `data-rh="true"` attribute between the tag name and the rest of the attributes
// (e.g. `<link data-rh="true" rel="canonical" href="...">`), so assertions below
// check attribute substrings rather than a literal `<link rel="canonical" ...` prefix.
test('home has canonical + hreflang + SoftwareApplication', () => {
  const html = dist('index.html')
  expect(html).toContain('rel="canonical" href="https://alfavit.uz/"')
  expect(html).toContain('hreflang="ru"')
  expect(html).toContain('hreflang="x-default"')
  expect(html).toContain('"@type":"SoftwareApplication"')
})

test('ru reform page canonical points at the ru URL', () => {
  // vite-react-ssg emits flat filenames: dist/ru/reform.html, not dist/ru/reform/index.html.
  const html = dist('ru/reform.html')
  expect(html).toContain('rel="canonical" href="https://alfavit.uz/ru/reform"')
})

test('every page carries Organization + WebSite schema', () => {
  const html = dist('index.html')
  expect(html).toContain('"@type":"Organization"')
  expect(html).toContain('"@type":"WebSite"')
  // vite-react-ssg emits flat filenames: dist/ru/reform.html, not dist/ru/reform/index.html.
  const ru = dist('ru/reform.html')
  expect(ru).toContain('"@type":"Organization"')
  expect(ru).toContain('"@type":"BreadcrumbList"')
})

test('the alphabet page ships the chart image and its ImageObject schema', () => {
  const html = dist('alphabet.html')
  // Prerendered, not client-rendered: Google Images should not have to execute
  // JavaScript to find the one image on the page.
  expect(html).toContain('src="/chart/lotin-alifbosi-jadvali-2026.png"')
  expect(html).toContain('loading="lazy"')
  expect(html).toContain('"@type":"ImageObject"')
  expect(html).toContain('"acquireLicensePage":"https://alfavit.uz/alphabet"')
  // Intrinsic dimensions must be present or the lazy image shifts the page.
  expect(html).toMatch(/width="1270"[^>]*height="1796"|height="1796"[^>]*width="1270"/)

  const en = dist('en/alphabet.html')
  expect(en).toContain('src="/chart/uzbek-latin-alphabet-2026.png"')
})
