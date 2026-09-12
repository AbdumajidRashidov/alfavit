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

test('content pages carry both dates and a script-qualified language', () => {
  const html = dist('alphabet.html')
  expect(html).toContain('"datePublished":"2026-07-17"')
  expect(html).toContain('"dateModified":"2026-09-13"')
  expect(html).toContain('"inLanguage":"uz-Latn"')
  expect(dist('ru/reform.html')).toContain('"inLanguage":"ru"')
  expect(dist('en/reform.html')).toContain('"inLanguage":"en"')
})

test('the breadcrumb names the page, not the whole title', () => {
  const html = dist('alphabet.html')
  expect(html).toContain('"name":"Oʻzbek alifbosi","item":"https://alfavit.uz/alphabet"')
  // The old bug: the full <title>, site suffix and all, as the second crumb.
  expect(html).not.toContain('"name":"Oʻzbek alifbosi (2026) — toʻliq yangilangan lotin jadvali | Alfavit"')
})

test('the alphabet is published as a DefinedTermSet, one term per letter', () => {
  const html = dist('alphabet.html')
  expect(html).toContain('"@type":"DefinedTermSet"')
  expect((html.match(/"@type":"DefinedTerm"/g) ?? []).length).toBe(28)
  expect(html).toContain('"name":"Ş ş"')
})

test('404.html is built, noindex, and free of canonical or hreflang', () => {
  const html = dist('404.html')
  expect(html).toContain('name="robots" content="noindex, follow"')
  expect(html).not.toContain('rel="canonical"')
  expect(html).not.toContain('hreflang=')
})
