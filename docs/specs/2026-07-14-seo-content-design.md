# Alfavit SEO/LLMEO — Spec 2: Content

**Date:** 2026-07-14
**Status:** Design approved, pending spec review
**Depends on:** Spec 1 (Discoverability Foundation) — done/merged. This spec adds the content that rides on that SSG/per-locale/schema foundation.

## Goal

Publish the content that captures the Uzbek public's uz/ru search intent (and secondary en) around the 2026 alphabet reform and script conversion — a FAQ, an expanded reform reference, a 28-letter alphabet reference, and two how-to guides — as structured, prerendered, schema-marked pages that rank in search and get cited by LLMs.

## Primary audience

Uzbek public searching in **uz and ru** ("kirilldan lotinga", "yangi alifbo 2026", "кириллица на латиницу", "nechta harf"). English is the secondary reform/dev audience.

## Content architecture (decided)

**Structured TypeScript content modules** under `apps/web/src/content/`. Content is typed data, not markdown — no new dependencies, type-safe, rendered by React components, and the JSON-LD is generated from the *same* source so schema can't drift from what's shown. Chosen because the content is semi-structured (Q&A pairs, letter tables, sectioned guides), not long-form prose.

## Page map & locale coverage

Five content surfaces (the originally-requested set consolidated to avoid thin/cannibalizing pages):

| Route | Status | Locales | Schema | Target intent |
|-------|--------|---------|--------|---------------|
| `/faq` | new | uz, ru, en | FAQPage + BreadcrumbList | "nega alifbo oʻzgardi", "nechta harf", "qachon oʻzgaradi" |
| `/reform` | expand existing | uz, ru, en | Article + BreadcrumbList | "alifbo islohoti 2026" + letter long-tail (anchored sections) |
| `/alphabet` | new | uz, ru, en | Article + BreadcrumbList | "yangi oʻzbek alifbosi barcha harflar", alphabet chart, LLM citation |
| `/guide/cyrillic-to-latin` | new | uz, ru | HowTo + BreadcrumbList | biggest transactional cluster; funnels to the converter |
| `/guide/old-latin-to-new` | new | uz, ru | HowTo + BreadcrumbList | old-Latin (1995) apostrophe-letter migration |

**Consolidation decisions:**
- The **5 letter-change spotlights** (sh→ş, ch→ç, gʻ→ğ, oʻ→ŏ, loanword ts→c) are **anchored sections within `/reform`** (`/reform#sh`, `#ch`, …), not separate pages — capturing long-tail queries without thin/duplicate pages.
- `/reform` (narrative: what changed & why) and `/alphabet` (pure reference chart) stay **distinct by intent** with differentiated content, cross-linked.
- **Routing:** stable English slugs, localized content (no per-locale slugs in v1).

## The one foundation change: per-page locale coverage

Spec 1's `PAGE_PATHS` in `apps/web/src/seo/config.ts` assumes every page exists in all 3 locales (sitemap = `PAGE_PATHS × LOCALES`). The two guides are uz/ru only, so:

- Extend each `PAGE_PATHS` entry with `locales: Locale[]` (defaults to all three; guides = `['uz','ru']`).
- `generateSitemapXml()` iterates each page's own `locales` (so `/en/guide/...` is never emitted).
- The router builds the ru/en subtrees to include only pages whose `locales` include that locale.
- `<Seo>` hreflang alternates list only the page's available locales (+ `x-default` → uz).

## Content modules

Under `apps/web/src/content/`:

- `types.ts` — shared content types:
  - `FaqItem { q: string; a: string }`
  - `Guide { title: string; intro: string; steps: { heading: string; body: string }[]; examples?: [from: string, to: string][] }`
  - `AlphabetRow { latin: string; cyrillic: string; oldLatin: string; name: string; exampleNew: string }`
  - `ReformSpotlight { id: string; from: string; to: string; body: string; examples: [string, string][] }`
- `faq.ts` — `faq: Record<Locale, FaqItem[]>`
- `reform.ts` — `Record<Locale, { intro; law; why; history; spotlights: ReformSpotlight[] }>`
- `alphabet.ts` — invariant `ALPHABET: AlphabetRow[]` (letters/equivalents don't change by UI language) + `Record<Locale, { intro; columnLabels }>` for localized chrome
- `guides/cyrillicToLatin.ts`, `guides/oldLatinToNew.ts` — `Record<'uz'|'ru', Guide>`

**Rendering components** (`apps/web/src/pages` + `components`):
- `FaqPage` → renders `faq[locale]` as a semantic Q&A list (each Q an `<h2>`/`<h3>`, answer prose) + `<Seo>`.
- `ReformPage` (expand) → intro/why/law/history + a spotlight section per `ReformSpotlight` with `id` anchors.
- `AlphabetPage` → the `ALPHABET` table (accessible `<table>`, all 28 letters + apostrophe sign) + localized intro.
- `GuidePage` — one generic component driven by a `Guide`, reused by both guide routes.

## Structured data (JSON-LD)

Added to `apps/web/src/seo/jsonld.ts`, generated from the content data (so counts/questions always match the page):

- `faqPageLd(items: FaqItem[])` → `FAQPage` with a `Question`/`Answer` per item.
- `howToLd(guide: Guide)` → `HowTo` with a `HowToStep` per `steps[]`.
- `articleLd(title, description, url)` → `Article` for `/reform` and `/alphabet`.
- `BreadcrumbList` (existing `breadcrumbLd`) on every new page.

`<Seo>` gains an optional `jsonLd` already; pages pass their page-type schema.

## Internal linking (content hub) + discovery

- **Nav:** add a single `FAQ` link (high value); keep the rest for the footer to avoid nav crowding.
- **Footer:** add `FAQ` and `Alphabet`.
- **Cross-links in content:** `/reform` ↔ `/alphabet` ↔ `/faq`; both guides link to the home converter and to `/reform`. The home "more" cards may add a link to `/faq`.
- **`llms.txt`:** expand to list all five content pages with one-line descriptions and to include the reform facts already present — a direct LLMEO win (LLMs read `llms.txt` to find citable pages).
- **`sitemap.xml`:** picks up the new pages automatically via `PAGE_PATHS` (with per-page locales).

## Content accuracy (constraint)

Content is authored by the assistant (uz/ru/en) and **must be verified by the user (native speaker)** before publish — especially Uzbek orthography and the reform facts. Do **not** assert orthography that the reform grounding marks unverified (the е/ц/ъ/ь transliteration and the ъ→U+02BC vs oʻ→U+02BB apostrophe question are still open per Spec-0 notes); FAQ/reform copy must stay within confirmed facts (the 5 canonical letter changes, 28 letters + 1 apostrophe sign, adopted 7 July 2026). When a fact is uncertain, omit it rather than guess.

## Testing

- **Unit (fast `test`):**
  - `faqPageLd`/`howToLd`/`articleLd` produce valid schema.org shapes with the right item/step counts.
  - `generateSitemapXml()` respects per-page `locales` — asserts `/guide/cyrillic-to-latin` and `/ru/guide/cyrillic-to-latin` are present but `/en/guide/cyrillic-to-latin` is **absent**.
  - Content modules: every `Record<Locale, …>` has entries for each declared locale (no missing translations).
- **Build-output (`test:dist`, post-build):**
  - `/faq` HTML (uz + ru + en) contains a known question and its `FAQPage` JSON-LD.
  - `/alphabet` HTML contains the reformed letters (ş, ç, ğ, ŏ, c) and Article JSON-LD.
  - `/reform` HTML contains the spotlight section anchors.
  - Guide HTML exists for uz + ru with `HowTo` JSON-LD; `dist/en/guide/cyrillic-to-latin.html` does **not** exist.
- **Hydration:** preview, navigate the new pages + switch locale, no console/hydration errors.
- Existing suites stay green.

## Out of scope (later)

- Per-locale slugs; English versions of the two guides; a blog/news section; on-site search; user comments; the held orthography decisions (Spec-0 backlog).

## Success criteria

- Five content surfaces live, each prerendered in its declared locales with correct FAQPage/Article/HowTo + BreadcrumbList and hreflang listing only available locales.
- `llms.txt` and `sitemap.xml` include the new pages (guides uz/ru only).
- Content reviewed and confirmed by the user; no unverified orthography asserted.
- All tests green (unit + `test:dist`); no hydration errors; deploys unchanged.
