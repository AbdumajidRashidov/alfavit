import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { pageDates } from '../seo/config'
import { STAGE, STATUS_COPY, legalForce } from '../content/status'

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
  // Read from PAGE_PATHS, so a content change that re-dates the page does not
  // fail a correct build.
  expect(html).toContain(`"datePublished":"${pageDates('alphabet').published}"`)
  expect(html).toContain(`"dateModified":"${pageDates('alphabet').updated}"`)
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

test('/status answers the question in the markup and declares its legal force', () => {
  // Follows STAGE, as the page does. Pinning one stage's headline here failed
  // the signature-day build for a correct page.
  const html = dist('status.html')
  expect(html).toContain(STATUS_COPY[STAGE].uz.headline)
  expect(html).toContain('"@type":"Legislation"')
  expect(html).toContain(`"legislationLegalForce":"${legalForce()}"`)
  // Once signed, the schema's date is the signing date and it carries the law's number.
  if (STAGE === 'awaiting-signature') {
    expect(html).toContain('"legislationDate":"2026-07-07"')
  } else {
    expect(html).toContain('"legislationDate":"2026-10-21"')
    expect(html).toContain('"legislationIdentifier":"OʻRQ-1184"')
    expect(html).toContain('"sameAs":"https://lex.uz/uz/docs/8548754"')
    // The in-force date is in the prerendered HTML, not only in the client-side countdown.
    expect(html).toContain('datetime="2027-04-22"')
    expect(html).toContain('Yangi alifbo qachon kuchga kiradi?')
  }
  expect(html).toContain('rel="canonical" href="https://alfavit.uz/status"')

  // Localised, not just the default locale prerendered three times.
  expect(dist('en/status.html')).toContain(STATUS_COPY[STAGE].en.headline)
  expect(dist('ru/status.html')).toContain(STATUS_COPY[STAGE].ru.headline)
})

test('the alphabet page answers the letter-count query under its own heading', () => {
  const html = dist('alphabet.html')
  expect(html).toContain('id="nechta-harf"')
  expect(html).toContain('Oʻzbek alifbosida nechta harf bor?')
  expect(dist('en/alphabet.html')).toContain('How many letters are in the Uzbek alphabet?')
})

test('the alphabet page prerenders a visible converter between the intro and the letter count', () => {
  const pages = [
    ['alphabet.html', 'Matningizni yangi alifboga oʻgiring'],
    ['ru/alphabet.html', 'Переведите свой текст на новый алфавит'],
    ['en/alphabet.html', 'Convert your text to the new alphabet'],
  ]
  for (const [file, heading] of pages) {
    const html = dist(file)
    const h1 = html.indexOf('</h1>')
    const converter = html.indexOf('id="converter-input"')
    const count = html.indexOf('id="nechta-harf"')
    expect(h1).toBeGreaterThan(-1)
    expect(converter).toBeGreaterThan(h1)
    expect(count).toBeGreaterThan(converter)
    expect(html).toContain(heading)
    expect(html).toContain('placeholder="Oʻzbekiston, Toshkent, choʻl, togʻ"')
    expect(html).toContain('Özbekiston, Toşkent, çöl, toğ')
    // Above the fold, so it must be in the server HTML at full opacity: the
    // home page's fade-in starts at opacity 0 and waits for hydration.
    expect(html.slice(h1, count)).not.toContain('opacity:0')
  }
})

test('/kirill is prerendered as Uzbek Cyrillic', () => {
  const html = dist('kirill.html')
  expect(html).toMatch(/<html[^>]*lang="uz-Cyrl"/)
  expect(html).toContain('"inLanguage":"uz-Cyrl"')
  // One page, no translations: hreflang alternates would point only at itself.
  expect(html).not.toContain('hreflang=')
})

test('/alphabet FAQPage carries exactly the visible questions', () => {
  const html = dist('alphabet.html')
  const m = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(\{"@context":"https:\/\/schema.org","@type":"FAQPage".*?)<\/script>/)
  expect(m).not.toBeNull()
  const qs = JSON.parse(m![1]).mainEntity.map((e: { name: string }) => e.name)
  expect(qs).toHaveLength(4)
  for (const q of qs) expect(html).toContain(`>${q}</h2>`)
})
