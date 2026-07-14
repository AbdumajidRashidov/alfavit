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
