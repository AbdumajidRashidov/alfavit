# SEO Content (Spec 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the FAQ, an expanded reform reference, and two how-to guides as structured, prerendered, schema-marked pages that capture the Uzbek public's uz/ru search intent — riding on the Spec 1 discoverability foundation.

**Architecture:** Content lives as typed TypeScript modules under `apps/web/src/content/`; React page components render it; JSON-LD (FAQPage / HowTo / Article) is generated from the same content data. A per-page locale field extends the Spec 1 config so the two guides ship uz/ru only while the sitemap, hreflang, and router all respect each page's locale set.

**Tech Stack:** React 18, react-router-dom 6, vite-react-ssg (SSG + `<Head>`), TypeScript, Vitest.

## Global Constraints

- Canonical origin is exactly `https://alfavit.uz`.
- Locales: `uz` (root), `ru` (`/ru`), `en` (`/en`). Every page includes `uz` (DEFAULT_LOCALE); the two guides are `['uz','ru']` only.
- Stable English slugs, localized content (no per-locale slugs).
- Content is authored here and **must be verified by the user (native speaker)** before merge — especially Uzbek/Russian phrasing. Stay within confirmed facts only: the five canonical changes (sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ, loanword ts→c), 28 letters + 1 apostrophe sign (tutuq belgisi), adopted 7 July 2026. Do NOT assert the unverified е/ц/ъ/ь orthography or the apostrophe-codepoint question — omit uncertain facts.
- `/alphabet` is out of scope (deferred — needs the authoritative Cabinet orthography table).
- No emojis — inline SVG only.
- Head via vite-react-ssg's `<Head>` (react-helmet-async); no `@unhead/react`.
- Test split (Spec 1): `pnpm --dir apps/web test` = fast unit run (no `dist`); `pnpm --dir apps/web test:dist` = build + build-output assertions via `vitest.dist.config.ts`. New build-output tests must be added to `vitest.dist.config.ts`'s `include`.
- Commit as `-c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz"`, trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

- `apps/web/src/content/types.ts` — **new.** `FaqItem`, `ReformSpotlight`, `Guide`.
- `apps/web/src/content/faq.ts` — **new.** `faq: Record<Locale, FaqItem[]>`.
- `apps/web/src/content/reform.ts` — **new.** `spotlights: Record<Locale, ReformSpotlight[]>`.
- `apps/web/src/content/guides/cyrillicToLatin.ts`, `.../oldLatinToNew.ts` — **new.** `Record<'uz'|'ru', Guide>`.
- `apps/web/src/pages/FaqPage.tsx`, `GuideCyrillicPage.tsx`, `GuideOldLatinPage.tsx` — **new.**
- `apps/web/src/components/GuidePage.tsx` — **new.** Generic guide renderer.
- `apps/web/src/pages/ReformPage.tsx` — **modify.** Add spotlight sections + Article schema.
- `apps/web/src/seo/config.ts` — **modify.** Per-page `locales`, `localesForPath`, sitemap.
- `apps/web/src/seo/jsonld.ts` — **modify.** `faqPageLd`, `howToLd`, `articleLd`.
- `apps/web/src/components/Seo.tsx` — **modify.** hreflang from per-page locales.
- `apps/web/src/router.tsx` — **modify.** Registry + per-locale child filtering + new routes.
- `apps/web/src/i18n/translations.ts` — **modify.** `meta.faq.*`, `meta.guide.*`, `nav.faq`, `footer.faq`.
- `apps/web/src/components/{Nav,Footer}.tsx` — **modify.** FAQ links.
- `apps/web/public/llms.txt` — **modify.** List new pages.
- `apps/web/src/tests/*` + `apps/web/vitest.dist.config.ts` — **modify/new.** Unit + build-output tests.

---

## Task 1: Foundation — per-page locales + JSON-LD builders

Pure config/schema changes with no new pages yet. Existing 6 pages keep all-locale behavior.

**Files:**
- Modify: `apps/web/src/seo/config.ts`, `apps/web/src/components/Seo.tsx`, `apps/web/src/router.tsx`
- Create: `apps/web/src/seo/jsonld` additions (in existing `jsonld.ts`)
- Test: `apps/web/src/tests/seo.test.ts` (extend), `apps/web/src/tests/jsonld.test.ts` (new)

**Interfaces:**
- Produces:
  - `PAGE_PATHS: { path: string; priority: number; locales: readonly Locale[] }[]`
  - `localesForPath(pagePath: string): readonly Locale[]`
  - `faqPageLd(items: { q: string; a: string }[]): object`
  - `howToLd(name: string, steps: { heading: string; body: string }[]): object`
  - `articleLd(headline: string, description: string, url: string): object`

- [ ] **Step 1: Write failing unit tests**

Extend `apps/web/src/tests/seo.test.ts` — add:

```ts
import { localesForPath } from '../seo/config'

test('localesForPath: guides are uz/ru only, others all locales', () => {
  expect(localesForPath('')).toEqual(['uz', 'ru', 'en'])
  expect(localesForPath('guide/cyrillic-to-latin')).toEqual(['uz', 'ru'])
  expect(localesForPath('unknown')).toEqual(['uz', 'ru', 'en'])
})

test('sitemap omits en for uz/ru-only guides', () => {
  const xml = generateSitemapXml()
  expect(xml).toContain('<loc>https://alfavit.uz/guide/cyrillic-to-latin</loc>')
  expect(xml).toContain('<loc>https://alfavit.uz/ru/guide/cyrillic-to-latin</loc>')
  expect(xml).not.toContain('https://alfavit.uz/en/guide/cyrillic-to-latin')
  expect(xml).toContain('<loc>https://alfavit.uz/faq</loc>')
})
```

Create `apps/web/src/tests/jsonld.test.ts`:

```ts
import { expect, test } from 'vitest'
import { faqPageLd, howToLd, articleLd } from '../seo/jsonld'

test('faqPageLd builds a FAQPage with one Question per item', () => {
  const ld = faqPageLd([{ q: 'A?', a: 'B.' }, { q: 'C?', a: 'D.' }]) as any
  expect(ld['@type']).toBe('FAQPage')
  expect(ld.mainEntity).toHaveLength(2)
  expect(ld.mainEntity[0]).toMatchObject({ '@type': 'Question', name: 'A?', acceptedAnswer: { '@type': 'Answer', text: 'B.' } })
})

test('howToLd builds a HowTo with positioned steps', () => {
  const ld = howToLd('Do it', [{ heading: 'One', body: 'first' }]) as any
  expect(ld['@type']).toBe('HowTo')
  expect(ld.step[0]).toMatchObject({ '@type': 'HowToStep', position: 1, name: 'One', text: 'first' })
})

test('articleLd builds an Article', () => {
  const ld = articleLd('H', 'D', 'https://alfavit.uz/reform') as any
  expect(ld['@type']).toBe('Article')
  expect(ld).toMatchObject({ headline: 'H', description: 'D', url: 'https://alfavit.uz/reform' })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --dir apps/web exec vitest run src/tests/seo.test.ts src/tests/jsonld.test.ts`
Expected: FAIL — `localesForPath`, `faqPageLd`, `howToLd`, `articleLd` undefined.

- [ ] **Step 3: Update `seo/config.ts`**

Replace the `PAGE_PATHS` block and add `localesForPath`; update `generateSitemapXml` to iterate per-page locales:

```ts
export const PAGE_PATHS: { path: string; priority: number; locales: readonly Locale[] }[] = [
  { path: '', priority: 1.0, locales: LOCALES },
  { path: 'files', priority: 0.8, locales: LOCALES },
  { path: 'apps', priority: 0.8, locales: LOCALES },
  { path: 'developers', priority: 0.8, locales: LOCALES },
  { path: 'reform', priority: 0.7, locales: LOCALES },
  { path: 'faq', priority: 0.7, locales: LOCALES },
  { path: 'guide/cyrillic-to-latin', priority: 0.6, locales: ['uz', 'ru'] },
  { path: 'guide/old-latin-to-new', priority: 0.6, locales: ['uz', 'ru'] },
  { path: 'privacy', priority: 0.3, locales: LOCALES },
]

export function localesForPath(pagePath: string): readonly Locale[] {
  return PAGE_PATHS.find((p) => p.path === pagePath)?.locales ?? LOCALES
}

export function generateSitemapXml(): string {
  const urls = PAGE_PATHS.flatMap(({ path, priority, locales }) =>
    locales.map((locale) => {
      const loc = SITE_URL + localePath(locale, path)
      const alts = locales
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL + localePath(l, path)}"/>`)
        .join('\n')
      const xdefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL + localePath(DEFAULT_LOCALE, path)}"/>`
      return `  <url>\n    <loc>${loc}</loc>\n${alts}\n${xdefault}\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}
```

- [ ] **Step 4: Update `Seo.tsx` hreflang to per-page locales**

In `apps/web/src/components/Seo.tsx`, change the import and the hreflang loop:

```ts
import { SITE_URL, LOCALES, DEFAULT_LOCALE, localePath, localesForPath } from '../seo/config'
```
(remove the unused `LOCALES` if it lints; it is no longer used — keep only `DEFAULT_LOCALE`, `localePath`, `localesForPath`, `SITE_URL`.)

Replace the hreflang block:
```tsx
      {localesForPath(pagePath).map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={SITE_URL + localePath(l, pagePath)} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={SITE_URL + localePath(DEFAULT_LOCALE, pagePath)} />
```

- [ ] **Step 5: Update `router.tsx` to a locale-filtered registry**

Replace `apps/web/src/router.tsx` with:

```tsx
import type { RouteRecord } from 'vite-react-ssg'
import type { ComponentType } from 'react'
import { RootLayout } from './components/RootLayout'
import { HomePage } from './pages/HomePage'
import { FilesPage } from './pages/FilesPage'
import { AppsPage } from './pages/AppsPage'
import { DevelopersPage } from './pages/DevelopersPage'
import { ReformPage } from './pages/ReformPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { localesForPath, type Locale } from './seo/config'

interface PageDef { path: string; Component: ComponentType; index?: boolean }

const PAGES: PageDef[] = [
  { path: '', Component: HomePage, index: true },
  { path: 'files', Component: FilesPage },
  { path: 'apps', Component: AppsPage },
  { path: 'developers', Component: DevelopersPage },
  { path: 'reform', Component: ReformPage },
  { path: 'privacy', Component: PrivacyPage },
]

function childrenFor(locale: Locale): RouteRecord[] {
  return PAGES.filter((p) => localesForPath(p.path).includes(locale)).map((p) =>
    p.index ? { index: true, Component: p.Component } : { path: p.path, Component: p.Component },
  )
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    entry: 'src/components/RootLayout.tsx',
    children: [
      ...childrenFor('uz'),
      { path: 'ru', children: childrenFor('ru') },
      { path: 'en', children: childrenFor('en') },
      { path: '*', Component: HomePage },
    ],
  },
]
```

(FAQ and guide pages get added to `PAGES` in their own tasks. This task keeps the existing 6 pages, now routed through the registry.)

- [ ] **Step 6: Add JSON-LD builders to `jsonld.ts`**

Append to `apps/web/src/seo/jsonld.ts`:

```ts
export function faqPageLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }
}

export function howToLd(name: string, steps: { heading: string; body: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.heading, text: s.body })),
  }
}

export function articleLd(headline: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    publisher: { '@type': 'Organization', name: 'Alfavit' },
  }
}
```

- [ ] **Step 7: Run tests**

Run: `pnpm --dir apps/web exec vitest run src/tests/seo.test.ts src/tests/jsonld.test.ts`
Expected: PASS.

Then the fast suite: `pnpm --dir apps/web test` — Expected: PASS (existing suites unaffected; router still renders the same 6 pages).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/seo apps/web/src/components/Seo.tsx apps/web/src/router.tsx apps/web/src/tests/seo.test.ts apps/web/src/tests/jsonld.test.ts
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web/seo): per-page locale coverage + FAQPage/HowTo/Article JSON-LD builders

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: FAQ page

**Files:**
- Create: `apps/web/src/content/types.ts`, `apps/web/src/content/faq.ts`, `apps/web/src/pages/FaqPage.tsx`
- Modify: `apps/web/src/router.tsx` (add to `PAGES`), `apps/web/src/i18n/translations.ts` (meta.faq.*, nav.faq, footer.faq), `apps/web/src/components/Nav.tsx`, `apps/web/src/components/Footer.tsx`, `apps/web/vitest.dist.config.ts`
- Test: `apps/web/src/tests/faq-build.test.ts` (build-output)

**Interfaces:**
- Consumes: `faqPageLd`, `Seo`, `localesForPath`.
- Produces: `faq: Record<Locale, FaqItem[]>`; `FaqItem { q: string; a: string }`.

- [ ] **Step 1: Create content types**

Create `apps/web/src/content/types.ts`:

```ts
export interface FaqItem {
  q: string
  a: string
}

export interface ReformSpotlight {
  id: string
  from: string
  to: string
  body: string
  examples: [string, string][]
}

export interface Guide {
  title: string
  intro: string
  steps: { heading: string; body: string }[]
  examples: [string, string][]
}
```

- [ ] **Step 2: Create the FAQ content**

Create `apps/web/src/content/faq.ts` (content is confirmed-facts-only; **user verifies uz/ru before merge**):

```ts
import type { Locale } from '../seo/config'
import type { FaqItem } from './types'

export const faq: Record<Locale, FaqItem[]> = {
  en: [
    { q: 'What changed in the 2026 Uzbek alphabet reform?', a: 'Uzbekistan replaced the 1995 digraphs and apostrophe-letters with single letters: sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ, and the loanword ts→c. The alphabet now has 28 letters and one apostrophe sign.' },
    { q: 'How many letters are in the new alphabet?', a: '28 letters and one apostrophe sign (tutuq belgisi). Previously there were 26 letters and 3 letter combinations.' },
    { q: 'When was the reform adopted?', a: 'It was adopted on 7 July 2026.' },
    { q: 'Which letters changed?', a: 'Five: sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ, and ts→c in loanwords.' },
    { q: 'Why did the alphabet change?', a: 'The 1995 digraphs and apostrophes broke software, URLs, and search, and made Uzbek inconsistent with other Turkic Latin alphabets. Single letters remove that friction.' },
    { q: 'How do I convert Cyrillic or old Latin to the new Latin?', a: 'Use the Alfavit converter — paste your text and it converts instantly, on your device.' },
    { q: 'Does Alfavit store or upload my text?', a: 'No. Conversion happens entirely in your browser; nothing is uploaded, stored, or tracked.' },
    { q: 'Is Alfavit free?', a: 'Yes — the web converter, the Telegram bot, and the public API are all free.' },
  ],
  uz: [
    { q: '2026-yilgi oʻzbek alifbosi islohotida nima oʻzgardi?', a: 'Oʻzbekiston 1995-yildagi qoʻsh harflar va apostrofli harflarni bitta harfga almashtirdi: sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ hamda oʻzlashma soʻzlardagi ts→c. Endi alifboda 28 ta harf va bitta tutuq belgisi bor.' },
    { q: 'Yangi alifboda nechta harf bor?', a: '28 ta harf va bitta tutuq belgisi. Avval 26 ta harf va 3 ta harf birikmasi bor edi.' },
    { q: 'Islohot qachon qabul qilindi?', a: '2026-yil 7-iyulda qabul qilindi.' },
    { q: 'Qaysi harflar oʻzgardi?', a: 'Beshta: sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ va oʻzlashma soʻzlardagi ts→c.' },
    { q: 'Nega alifbo oʻzgardi?', a: '1995-yilgi qoʻsh harflar va apostroflar dastur, URL va qidiruvni buzardi hamda oʻzbekchani boshqa turkiy lotin alifbolaridan farqli qilardi. Bitta harflar bu muammolarni bartaraf etadi.' },
    { q: 'Kirill yoki eski lotin matnini yangi lotinga qanday oʻgiraman?', a: 'Alfavit oʻgirgichidan foydalaning — matnni joylang, u qurilmangizda bir zumda oʻgiriladi.' },
    { q: 'Alfavit matnimni saqlaydimi yoki yuklaydimi?', a: 'Yoʻq. Oʻgirish toʻliq brauzeringizda amalga oshadi; hech narsa yuklanmaydi, saqlanmaydi yoki kuzatilmaydi.' },
    { q: 'Alfavit bepulmi?', a: 'Ha — veb oʻgirgich, Telegram bot va ochiq API bepul.' },
  ],
  ru: [
    { q: 'Что изменилось в реформе узбекского алфавита 2026 года?', a: 'Узбекистан заменил диграфы и буквы с апострофом образца 1995 года одиночными буквами: sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ и ts→c в заимствованиях. Теперь в алфавите 28 букв и один знак апострофа.' },
    { q: 'Сколько букв в новом алфавите?', a: '28 букв и один знак апострофа (tutuq belgisi). Раньше было 26 букв и 3 буквосочетания.' },
    { q: 'Когда принята реформа?', a: 'Реформа принята 7 июля 2026 года.' },
    { q: 'Какие буквы изменились?', a: 'Пять: sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ и ts→c в заимствованиях.' },
    { q: 'Почему алфавит изменили?', a: 'Диграфы и апострофы образца 1995 года ломали ПО, URL и поиск и делали узбекскую латиницу непохожей на другие тюркские. Одиночные буквы устраняют это.' },
    { q: 'Как конвертировать кириллицу или старую латиницу в новую?', a: 'Используйте конвертер Alfavit — вставьте текст, и он преобразуется мгновенно на вашем устройстве.' },
    { q: 'Alfavit хранит или загружает мой текст?', a: 'Нет. Конвертация выполняется полностью в браузере; ничего не загружается, не хранится и не отслеживается.' },
    { q: 'Alfavit бесплатный?', a: 'Да — веб-конвертер, Telegram-бот и публичный API бесплатны.' },
  ],
}
```

- [ ] **Step 3: Add translation keys**

In `apps/web/src/i18n/translations.ts`, add these keys to each locale block (values below; keep the existing keys). Add to the `en` block:

```ts
    'nav.faq': 'FAQ',
    'footer.faq': 'FAQ',
    'meta.faq.title': 'FAQ — Alfavit',
    'meta.faq.desc': "Answers about Uzbekistan's 2026 alphabet reform and converting Cyrillic or old Latin to the new Latin script.",
    'faq.title': 'Frequently asked questions',
```

Add to the `uz` block:
```ts
    'nav.faq': 'Savol-javob',
    'footer.faq': 'Savol-javob',
    'meta.faq.title': 'Savol-javob — Alfavit',
    'meta.faq.desc': 'Oʻzbekistonning 2026-yilgi alifbo islohoti va kirill/eski lotinni yangi lotinga oʻgirish haqida savol-javob.',
    'faq.title': 'Koʻp beriladigan savollar',
```

Add to the `ru` block:
```ts
    'nav.faq': 'Вопросы',
    'footer.faq': 'Вопросы',
    'meta.faq.title': 'Вопросы и ответы — Alfavit',
    'meta.faq.desc': 'Ответы о реформе узбекского алфавита 2026 и конвертации кириллицы или старой латиницы в новую латиницу.',
    'faq.title': 'Часто задаваемые вопросы',
```

- [ ] **Step 4: Create `FaqPage.tsx`**

Create `apps/web/src/pages/FaqPage.tsx`:

```tsx
import { useT } from '../i18n/useT'
import { Seo } from '../components/Seo'
import { faq } from '../content/faq'
import { faqPageLd } from '../seo/jsonld'

export function FaqPage() {
  const { t, locale } = useT()
  const items = faq[locale]
  return (
    <>
      <Seo titleKey="meta.faq.title" descKey="meta.faq.desc" pagePath="faq" jsonLd={faqPageLd(items)} breadcrumb />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-6xl text-foreground">{t('faq.title')}</h1>
        <dl className="mt-12 divide-y divide-black/10 border-t border-black/10">
          {items.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-lg font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 leading-relaxed text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
```

- [ ] **Step 5: Register the route**

In `apps/web/src/router.tsx`, add the import and the `PAGES` entry (after `reform`):

```tsx
import { FaqPage } from './pages/FaqPage'
```
```tsx
  { path: 'faq', Component: FaqPage },
```

- [ ] **Step 6: Add FAQ to Nav and Footer**

In `apps/web/src/components/Nav.tsx`, add to the `ITEMS` array (after the reform entry):
```tsx
  { key: 'nav.faq', to: '/faq' },
```

In `apps/web/src/components/Footer.tsx`, add a link inside the `<nav>` (after the reform link):
```tsx
          <Link to={lp('/faq')} className={cls}>{t('footer.faq')}</Link>
```

- [ ] **Step 7: Write the build-output test + register it**

Create `apps/web/src/tests/faq-build.test.ts`:

```ts
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
```

In `apps/web/vitest.dist.config.ts`, add the new file to `include`:
```ts
    include: ['src/tests/seo-head.test.ts', 'src/tests/sitemap-build.test.ts', 'src/tests/faq-build.test.ts'],
```

- [ ] **Step 8: Build + run tests**

Run:
```bash
pnpm --dir apps/web test
pnpm --dir apps/web test:dist
```
Expected: fast suite PASS; `test:dist` builds and the FAQ assertions PASS (`dist/faq.html`, `dist/ru/faq.html`, `dist/en/faq.html` exist with content + FAQPage JSON-LD).

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/content apps/web/src/pages/FaqPage.tsx apps/web/src/router.tsx apps/web/src/i18n/translations.ts apps/web/src/components/Nav.tsx apps/web/src/components/Footer.tsx apps/web/src/tests/faq-build.test.ts apps/web/vitest.dist.config.ts
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web): FAQ page (uz/ru/en) with FAQPage schema

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Expand the Reform page

**Files:**
- Create: `apps/web/src/content/reform.ts`
- Modify: `apps/web/src/pages/ReformPage.tsx`, `apps/web/vitest.dist.config.ts`
- Test: `apps/web/src/tests/reform-build.test.ts`

**Interfaces:**
- Consumes: `articleLd`, `Seo`, existing `reform.*` translation keys.
- Produces: `spotlights: Record<Locale, ReformSpotlight[]>`.

- [ ] **Step 1: Create the spotlight content**

Create `apps/web/src/content/reform.ts` (**user verifies uz/ru**):

```ts
import type { Locale } from '../seo/config'
import type { ReformSpotlight } from './types'

export const spotlights: Record<Locale, ReformSpotlight[]> = {
  en: [
    { id: 'sh', from: 'sh', to: 'ş', body: 'The digraph sh becomes the single letter ş.', examples: [['shahar', 'şahar'], ['ishlash', 'işlaş']] },
    { id: 'ch', from: 'ch', to: 'ç', body: 'The digraph ch becomes the single letter ç.', examples: [['choy', 'çoy'], ['kecha', 'keça']] },
    { id: 'gh', from: 'gʻ', to: 'ğ', body: 'The apostrophe-letter gʻ becomes ğ.', examples: [['gʻalaba', 'ğalaba'], ['bogʻ', 'boğ']] },
    { id: 'oh', from: 'oʻ', to: 'ŏ', body: 'The apostrophe-letter oʻ becomes ŏ.', examples: [['oʻzbek', 'ŏzbek'], ['koʻl', 'kŏl']] },
    { id: 'ts', from: 'ts', to: 'c', body: 'In loanwords, ts becomes c.', examples: [['tsirk', 'cirk'], ['tsex', 'cex']] },
  ],
  uz: [
    { id: 'sh', from: 'sh', to: 'ş', body: 'sh qoʻsh harfi bitta ş harfiga aylandi.', examples: [['shahar', 'şahar'], ['ishlash', 'işlaş']] },
    { id: 'ch', from: 'ch', to: 'ç', body: 'ch qoʻsh harfi bitta ç harfiga aylandi.', examples: [['choy', 'çoy'], ['kecha', 'keça']] },
    { id: 'gh', from: 'gʻ', to: 'ğ', body: 'gʻ harfi ğ harfiga aylandi.', examples: [['gʻalaba', 'ğalaba'], ['bogʻ', 'boğ']] },
    { id: 'oh', from: 'oʻ', to: 'ŏ', body: 'oʻ harfi ŏ harfiga aylandi.', examples: [['oʻzbek', 'ŏzbek'], ['koʻl', 'kŏl']] },
    { id: 'ts', from: 'ts', to: 'c', body: 'Oʻzlashma soʻzlarda ts birikmasi c harfiga aylandi.', examples: [['tsirk', 'cirk'], ['tsex', 'cex']] },
  ],
  ru: [
    { id: 'sh', from: 'sh', to: 'ş', body: 'Диграф sh заменён одной буквой ş.', examples: [['shahar', 'şahar'], ['ishlash', 'işlaş']] },
    { id: 'ch', from: 'ch', to: 'ç', body: 'Диграф ch заменён одной буквой ç.', examples: [['choy', 'çoy'], ['kecha', 'keça']] },
    { id: 'gh', from: 'gʻ', to: 'ğ', body: 'Буква gʻ заменена на ğ.', examples: [['gʻalaba', 'ğalaba'], ['bogʻ', 'boğ']] },
    { id: 'oh', from: 'oʻ', to: 'ŏ', body: 'Буква oʻ заменена на ŏ.', examples: [['oʻzbek', 'ŏzbek'], ['koʻl', 'kŏl']] },
    { id: 'ts', from: 'ts', to: 'c', body: 'В заимствованиях ts заменяется на c.', examples: [['tsirk', 'cirk'], ['tsex', 'cex']] },
  ],
}
```

- [ ] **Step 2: Add a spotlights heading key**

In `apps/web/src/i18n/translations.ts`, add to each locale: `en` → `'reform.spotlightsLabel': 'Letter by letter',` ; `uz` → `'reform.spotlightsLabel': 'Harfma-harf',` ; `ru` → `'reform.spotlightsLabel': 'Буква за буквой',`.

- [ ] **Step 3: Expand `ReformPage.tsx`**

Replace `apps/web/src/pages/ReformPage.tsx` with (keeps the existing top table; adds Article schema + spotlight sections with anchors):

```tsx
import { useT } from '../i18n/useT'
import { Seo } from '../components/Seo'
import { spotlights } from '../content/reform'
import { articleLd } from '../seo/jsonld'
import { SITE_URL, localePath } from '../seo/config'

const CHANGES: Array<[string, string]> = [
  ['Sh sh', 'Ş ş'],
  ['Ch ch', 'Ç ç'],
  ['Gʻ gʻ', 'Ğ ğ'],
  ['Oʻ oʻ', 'Ŏ ŏ'],
  ['Ts ts', 'C c'],
]

export function ReformPage() {
  const { t, locale } = useT()
  const items = spotlights[locale]
  const url = SITE_URL + localePath(locale, 'reform')
  return (
    <>
      <Seo
        titleKey="meta.reform.title"
        descKey="meta.reform.desc"
        pagePath="reform"
        jsonLd={articleLd(t('reform.title'), t('reform.intro'), url)}
        breadcrumb
      />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-6xl text-foreground">{t('reform.title')}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{t('reform.intro')}</p>

        <h2 className="mt-12 text-sm font-medium uppercase tracking-wider text-muted">{t('reform.changesLabel')}</h2>
        <div className="mt-4 divide-y divide-black/10 rounded-2xl border border-black/10">
          {CHANGES.map(([oldForm, newForm]) => (
            <div key={newForm} className="flex items-center justify-center gap-6 px-6 py-4 font-serif text-3xl">
              <span className="w-32 text-right text-muted">{oldForm}</span>
              <span aria-hidden="true" className="text-muted">→</span>
              <span className="w-32 text-foreground">{newForm}</span>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-sm font-medium uppercase tracking-wider text-muted">{t('reform.spotlightsLabel')}</h2>
        <div className="mt-4 space-y-10">
          {items.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-24">
              <h3 className="font-serif text-3xl text-foreground">
                {s.from} <span aria-hidden="true" className="text-muted">→</span> {s.to}
              </h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-foreground">
                {s.examples.map(([from, to]) => (
                  <span key={from}>{from} → {to}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-16 leading-relaxed text-foreground">{t('reform.law')}</p>
        <p className="mt-4 leading-relaxed text-muted">{t('reform.why')}</p>
      </section>
    </>
  )
}
```

- [ ] **Step 4: Build-output test + register**

Create `apps/web/src/tests/reform-build.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const dist = (p: string) => readFileSync(resolve(__dirname, '../../dist', p), 'utf-8')

test('reform page has spotlight anchors + Article schema', () => {
  const html = dist('reform.html')
  expect(html).toContain('id="sh"')
  expect(html).toContain('id="ts"')
  expect(html).toContain('"@type":"Article"')
  expect(html).toContain('şahar')
})
```

Add `'src/tests/reform-build.test.ts'` to `include` in `apps/web/vitest.dist.config.ts`.

- [ ] **Step 5: Build + test**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web test:dist`
Expected: PASS (reform anchors + Article + example text in built HTML; existing routing test still passes since `Ş ş` etc. remain).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/content/reform.ts apps/web/src/pages/ReformPage.tsx apps/web/src/i18n/translations.ts apps/web/src/tests/reform-build.test.ts apps/web/vitest.dist.config.ts
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web): expand reform page with letter spotlights + Article schema

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: How-to guides (uz/ru)

**Files:**
- Create: `apps/web/src/content/guides/cyrillicToLatin.ts`, `apps/web/src/content/guides/oldLatinToNew.ts`, `apps/web/src/components/GuidePage.tsx`, `apps/web/src/pages/GuideCyrillicPage.tsx`, `apps/web/src/pages/GuideOldLatinPage.tsx`
- Modify: `apps/web/src/router.tsx`, `apps/web/src/i18n/translations.ts`, `apps/web/vitest.dist.config.ts`
- Test: `apps/web/src/tests/guides-build.test.ts`

**Interfaces:**
- Consumes: `Guide` type, `howToLd`, `Seo`, `useLocalePath`.
- Produces: `cyrillicToLatin: Record<'uz'|'ru', Guide>`, `oldLatinToNew: Record<'uz'|'ru', Guide>`; `GuidePage` component.

- [ ] **Step 1: Create guide content**

Create `apps/web/src/content/guides/cyrillicToLatin.ts` (**user verifies**):

```ts
import type { Guide } from '../types'

export const cyrillicToLatin: Record<'uz' | 'ru', Guide> = {
  uz: {
    title: 'Kirill alifbosidan yangi lotinga oʻgirish',
    intro: 'Kirilldagi oʻzbek matnini 2026-yilgi yangi lotin yozuviga bir necha soniyada oʻgiring — bepul va qurilmangizda.',
    steps: [
      { heading: 'Matnni nusxalang', body: 'Kirilldagi matningizni belgilab, nusxalab oling.' },
      { heading: 'Oʻgirgichni oching', body: 'Alfavit bosh sahifasidagi oʻgirgichga oʻting.' },
      { heading: 'Matnni joylang', body: 'Matnni kiritish maydoniga joylang — Alfavit yozuvni avtomatik aniqlab, yangi lotinga oʻgiradi.' },
      { heading: 'Natijani oling', body: 'Yangi lotindagi natijani nusxalab, kerakli joyga qoʻying.' },
    ],
    examples: [['Салом дунё', 'Salom dunyo'], ['Ўзбекча матн', 'Ŏzbekça matn'], ['шаҳар, чой', 'şahar, çoy']],
  },
  ru: {
    title: 'Конвертация с кириллицы в новую латиницу',
    intro: 'Преобразуйте узбекский текст с кириллицы в новую латиницу 2026 года за несколько секунд — бесплатно и на вашем устройстве.',
    steps: [
      { heading: 'Скопируйте текст', body: 'Выделите и скопируйте текст на кириллице.' },
      { heading: 'Откройте конвертер', body: 'Перейдите к конвертеру на главной странице Alfavit.' },
      { heading: 'Вставьте текст', body: 'Вставьте текст в поле ввода — Alfavit определит письмо и преобразует его в новую латиницу.' },
      { heading: 'Заберите результат', body: 'Скопируйте результат в новой латинице и вставьте, куда нужно.' },
    ],
    examples: [['Салом дунё', 'Salom dunyo'], ['Ўзбекча матн', 'Ŏzbekça matn'], ['шаҳар, чой', 'şahar, çoy']],
  },
}
```

Create `apps/web/src/content/guides/oldLatinToNew.ts`:

```ts
import type { Guide } from '../types'

export const oldLatinToNew: Record<'uz' | 'ru', Guide> = {
  uz: {
    title: 'Eski (1995) lotindan yangi lotinga',
    intro: '1995-yilgi lotin yozuvidagi qoʻsh harflar va apostrofli harflarni 2026-yilgi yangi lotinga oʻgiring.',
    steps: [
      { heading: 'Eski lotin matnini nusxalang', body: 'sh, ch, gʻ, oʻ kabi shakllar ishlatilgan matningizni nusxalang.' },
      { heading: 'Oʻgirgichni oching', body: 'Alfavit bosh sahifasidagi oʻgirgichga oʻting.' },
      { heading: 'Matnni joylang', body: 'Matnni joylang — qoʻsh harflar va apostrofli harflar bitta harfga oʻgiriladi.' },
      { heading: 'Natijani oling', body: 'ş, ç, ğ, ŏ harfli natijani nusxalab oling.' },
    ],
    examples: [['oʻzbek', 'ŏzbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
  ru: {
    title: 'Со старой латиницы (1995) на новую',
    intro: 'Преобразуйте диграфы и буквы с апострофом образца 1995 года в новую латиницу 2026 года.',
    steps: [
      { heading: 'Скопируйте старый текст', body: 'Скопируйте текст с формами sh, ch, gʻ, oʻ.' },
      { heading: 'Откройте конвертер', body: 'Перейдите к конвертеру на главной странице Alfavit.' },
      { heading: 'Вставьте текст', body: 'Вставьте текст — диграфы и буквы с апострофом станут одиночными буквами.' },
      { heading: 'Заберите результат', body: 'Скопируйте результат с буквами ş, ç, ğ, ŏ.' },
    ],
    examples: [['oʻzbek', 'ŏzbek'], ['gʻalaba', 'ğalaba'], ['shahar', 'şahar'], ['choy', 'çoy']],
  },
}
```

- [ ] **Step 2: Create the generic `GuidePage` component**

Create `apps/web/src/components/GuidePage.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLocalePath } from '../i18n/useLocalePath'
import { Seo } from './Seo'
import { howToLd } from '../seo/jsonld'
import type { Guide } from '../content/types'
import type { TranslationKey } from '../i18n/translations'

interface GuidePageProps {
  guide: Guide
  pagePath: string
  titleKey: TranslationKey
  descKey: TranslationKey
}

export function GuidePage({ guide, pagePath, titleKey, descKey }: GuidePageProps) {
  const { t } = useT()
  const lp = useLocalePath()
  return (
    <>
      <Seo titleKey={titleKey} descKey={descKey} pagePath={pagePath} jsonLd={howToLd(guide.title, guide.steps)} breadcrumb />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{guide.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{guide.intro}</p>

        <ol className="mt-12 space-y-6">
          {guide.steps.map((step, i) => (
            <li key={step.heading} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm text-background">{i + 1}</span>
              <div>
                <h2 className="font-medium text-foreground">{step.heading}</h2>
                <p className="mt-1 leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-2xl border border-black/10 p-6">
          <div className="flex flex-col gap-2 font-mono text-sm">
            {guide.examples.map(([from, to]) => (
              <div key={from} className="flex items-center gap-3">
                <span className="text-muted">{from}</span>
                <span aria-hidden="true" className="text-muted">→</span>
                <span className="text-foreground">{to}</span>
              </div>
            ))}
          </div>
        </div>

        <Link to={lp('/')} className="mt-10 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </Link>
      </section>
    </>
  )
}
```

- [ ] **Step 3: Create the two page wrappers**

Create `apps/web/src/pages/GuideCyrillicPage.tsx`:

```tsx
import { useT } from '../i18n/useT'
import { GuidePage } from '../components/GuidePage'
import { cyrillicToLatin } from '../content/guides/cyrillicToLatin'

export function GuideCyrillicPage() {
  const { locale } = useT()
  // Guides ship uz/ru only; the router never mounts this at /en.
  const guide = cyrillicToLatin[locale === 'ru' ? 'ru' : 'uz']
  return <GuidePage guide={guide} pagePath="guide/cyrillic-to-latin" titleKey="meta.guide.cyrillic.title" descKey="meta.guide.cyrillic.desc" />
}
```

Create `apps/web/src/pages/GuideOldLatinPage.tsx`:

```tsx
import { useT } from '../i18n/useT'
import { GuidePage } from '../components/GuidePage'
import { oldLatinToNew } from '../content/guides/oldLatinToNew'

export function GuideOldLatinPage() {
  const { locale } = useT()
  const guide = oldLatinToNew[locale === 'ru' ? 'ru' : 'uz']
  return <GuidePage guide={guide} pagePath="guide/old-latin-to-new" titleKey="meta.guide.oldlatin.title" descKey="meta.guide.oldlatin.desc" />
}
```

- [ ] **Step 4: Add meta keys (all three locales — the type requires en keys even though en routes aren't mounted)**

In `apps/web/src/i18n/translations.ts`, add to `en`:
```ts
    'meta.guide.cyrillic.title': 'Cyrillic to new Latin — Alfavit',
    'meta.guide.cyrillic.desc': 'Convert Uzbek text from Cyrillic to the reformed 2026 new Latin, step by step.',
    'meta.guide.oldlatin.title': 'Old Latin to new Latin — Alfavit',
    'meta.guide.oldlatin.desc': 'Convert 1995 old-Latin digraphs and apostrophe-letters to the new Latin, step by step.',
```
Add to `uz`:
```ts
    'meta.guide.cyrillic.title': 'Kirilldan lotinga oʻgirish — Alfavit',
    'meta.guide.cyrillic.desc': 'Kirilldagi oʻzbek matnini 2026-yilgi yangi lotin yozuviga qadamma-qadam oʻgiring.',
    'meta.guide.oldlatin.title': 'Eski lotindan yangi lotinga — Alfavit',
    'meta.guide.oldlatin.desc': '1995-yilgi qoʻsh harf va apostrofli harflarni yangi lotinga qadamma-qadam oʻgiring.',
```
Add to `ru`:
```ts
    'meta.guide.cyrillic.title': 'Кириллица в новую латиницу — Alfavit',
    'meta.guide.cyrillic.desc': 'Пошаговая конвертация узбекского текста с кириллицы в новую латиницу 2026.',
    'meta.guide.oldlatin.title': 'Старая латиница в новую — Alfavit',
    'meta.guide.oldlatin.desc': 'Пошаговая конвертация диграфов и букв с апострофом 1995 года в новую латиницу.',
```

- [ ] **Step 5: Register the guide routes**

In `apps/web/src/router.tsx`, add imports and `PAGES` entries:
```tsx
import { GuideCyrillicPage } from './pages/GuideCyrillicPage'
import { GuideOldLatinPage } from './pages/GuideOldLatinPage'
```
```tsx
  { path: 'guide/cyrillic-to-latin', Component: GuideCyrillicPage },
  { path: 'guide/old-latin-to-new', Component: GuideOldLatinPage },
```
(These are already `['uz','ru']` in `PAGE_PATHS`, so `childrenFor('en')` excludes them automatically.)

- [ ] **Step 6: Build-output test + register**

Create `apps/web/src/tests/guides-build.test.ts`:

```ts
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const distPath = (p: string) => resolve(__dirname, '../../dist', p)
const dist = (p: string) => readFileSync(distPath(p), 'utf-8')

test('cyrillic guide built for uz + ru with HowTo schema', () => {
  const uz = dist('guide/cyrillic-to-latin.html')
  expect(uz).toContain('Kirill alifbosidan yangi lotinga')
  expect(uz).toContain('"@type":"HowTo"')
  expect(dist('ru/guide/cyrillic-to-latin.html')).toContain('Конвертация с кириллицы')
})

test('old-latin guide built for uz + ru', () => {
  expect(dist('guide/old-latin-to-new.html')).toContain('Eski (1995) lotindan')
  expect(dist('ru/guide/old-latin-to-new.html')).toContain('латиницы')
})

test('guides are NOT built for en', () => {
  expect(existsSync(distPath('en/guide/cyrillic-to-latin.html'))).toBe(false)
  expect(existsSync(distPath('en/guide/old-latin-to-new.html'))).toBe(false)
})
```

Add both nothing — just add `'src/tests/guides-build.test.ts'` to `include` in `apps/web/vitest.dist.config.ts`.

- [ ] **Step 7: Build + test**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web test:dist`
Expected: PASS — guides built for uz + ru with HowTo schema; `dist/en/guide/*` absent.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/content/guides apps/web/src/components/GuidePage.tsx apps/web/src/pages/GuideCyrillicPage.tsx apps/web/src/pages/GuideOldLatinPage.tsx apps/web/src/router.tsx apps/web/src/i18n/translations.ts apps/web/src/tests/guides-build.test.ts apps/web/vitest.dist.config.ts
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web): Cyrillic and old-Latin how-to guides (uz/ru) with HowTo schema

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: llms.txt, cross-links & final verification

**Files:**
- Modify: `apps/web/public/llms.txt`, `apps/web/src/pages/HomePage.tsx`

- [ ] **Step 1: Expand `llms.txt`**

Replace `apps/web/public/llms.txt` with (adds the new content pages under Pages):

```markdown
# Alfavit

> Alfavit converts Uzbek text from Cyrillic or the old 1995 Latin script into Uzbekistan's reformed 2026 new Latin alphabet — free, instant, and fully on-device. No account, no upload, no tracking.

## Reform mapping (2026)

- sh → ş
- ch → ç
- gʻ → ğ
- oʻ → ŏ
- loanword ts → c

The 2026 reform (adopted 7 July 2026) replaced the 1995 digraphs and apostrophe-letters with single letters: 28 letters and one apostrophe sign.

## Pages

- [Converter](https://alfavit.uz/): the web converter (Cyrillic / old Latin → new Latin)
- [FAQ](https://alfavit.uz/faq): common questions about the reform and conversion
- [The 2026 reform](https://alfavit.uz/reform): what changed, letter by letter
- [Cyrillic → new Latin guide](https://alfavit.uz/guide/cyrillic-to-latin): step-by-step
- [Old Latin → new Latin guide](https://alfavit.uz/guide/old-latin-to-new): step-by-step
- [Files](https://alfavit.uz/files): convert .txt, .srt, and .docx files in-browser
- [Apps & channels](https://alfavit.uz/apps): web app, Telegram bot, browser extension, public API
- [Developers](https://alfavit.uz/developers): free public transliteration API, no key required
```

- [ ] **Step 2: Link FAQ from the home "more" cards**

In `apps/web/src/pages/HomePage.tsx`, add a FAQ entry to the `MORE` array:
```tsx
  { to: '/faq', key: 'nav.faq' },
```
(The array already maps through `lp(to)`, so no other change is needed.)

- [ ] **Step 3: Full clean build + verify all content ships**

Run:
```bash
rm -rf apps/web/dist
pnpm --dir apps/web build
for f in faq.html reform.html ru/faq.html ru/reform.html en/faq.html guide/cyrillic-to-latin.html ru/guide/old-latin-to-new.html; do
  test -s "apps/web/dist/$f" && echo "OK  $f" || echo "MISSING  $f"
done
test -f apps/web/dist/en/guide/cyrillic-to-latin.html && echo "BAD: en guide built" || echo "OK: no en guide"
grep -c "<loc>" apps/web/dist/sitemap.xml   # expect 25 (7 all-locale pages ×3 + 2 guides ×2)
grep -q "/faq" apps/web/dist/llms.txt && echo "llms.txt lists faq OK"
```
Expected: all `OK`, `OK: no en guide`, sitemap `<loc>` count = **25**, llms.txt lists faq.

> Sitemap math: 7 pages × 3 locales (home, files, apps, developers, reform, faq, privacy = 21) + 2 guides × 2 locales (4) = **25**.

- [ ] **Step 4: Full test suites**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web test:dist`
Expected: both PASS (unit incl. sitemap per-page-locale + jsonld; build-output incl. faq/reform/guides).

- [ ] **Step 5: Hydration check (preview)**

Serve and confirm no console/hydration errors and that new pages render + locale switch works:
```bash
pnpm --dir apps/web preview --port 4173 &
```
Using the Browser pane: open `http://localhost:4173/faq`, read console (expect none), click a nav locale to `/ru/faq`, confirm Russian questions; open `/guide/cyrillic-to-latin` and `/reform` (check a spotlight anchor like `/reform#sh` scrolls). Stop the preview server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/public/llms.txt apps/web/src/pages/HomePage.tsx
git -c user.name="Alfavit" -c user.email="abdumajid.r@iman.uz" commit -m "feat(web/seo): list new content in llms.txt + link FAQ from home

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the implementer

- **Content is draft-pending-verification.** All uz/ru strings must be read by the user (native speaker) before this branch merges — flag the content files (`content/faq.ts`, `content/reform.ts`, `content/guides/*`) explicitly in the task reports so the reviews surface them. Do not invent facts beyond the confirmed set in Global Constraints.
- **Flat filenames:** vite-react-ssg emits `dist/faq.html`, `dist/ru/faq.html`, `dist/guide/cyrillic-to-latin.html` (nested dir for the slash). If a locale index differs, verify actual paths with `ls apps/web/dist` and `ls apps/web/dist/guide`.
- **`Record<Locale, …>` completeness:** `faq.ts` and `reform.ts` are typed `Record<Locale, …>`, so TypeScript enforces all three locales exist — a missing locale is a compile error (good).
- Guides key off `locale === 'ru' ? 'ru' : 'uz'` because their content Record is `'uz'|'ru'` only; the router guarantees they never mount at `/en`, so the `'uz'` fallback is never hit in practice but keeps types total.
