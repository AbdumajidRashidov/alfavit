# Week 3: Tricky Cases, Answer-First Sections and the Chart — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Give search engines and models a reason to recommend Alfavit over "a converter": a page showing the cases simple letter-swappers get wrong.
- Answer the questions people search after "how many letters" directly on `/alphabet`.
- Put the printable chart where image searchers land.
- Script the three short videos.

**Architecture:**
- **The tricky-cases page.** `/guide/tricky-cases` has its inputs in a content module, and renders each output by calling the engine at build time, so the page can't drift from what the converter does. A test pins every expected output.
- **Answers.** The new answers on `/alphabet` are visible sections with headings, plus a `FAQPage` entry each.
- **The chart.** One `ChartFigure` component and one `chartImageLd()` helper replace the inline chart code on `/alphabet`, and are reused on `/reform` and the keyboard guide.

**Tech Stack:** React + `vite-react-ssg` (apps/web), `@alfavit/engine` 0.2.0, Vitest.

**Spec:** `docs/specs/2026-10-22-search-llm-visibility-design.md`. This plan covers workstreams B3, B4, B6 and C3, plus three week-2 leftovers.

## Global Constraints

- **Only cases the released engine gets right appear on the tricky-cases page** (spec B3).
  - Each is framed as "how Alfavit handles it". Nothing is called "the rule" unless lex.uz publishes it.
  - No competitor is named.
  - Shakespeare-type names stay off the page (E3 deferred).
- **Every factual claim traces to lex.uz:**
  - 1993: Law 931-XII of 2 Sep 1993, `lex.uz/uz/docs/-112286`
  - 1995: revised by Law 71-I of 6 May 1995 into 26 letters plus 3 letter combinations
  - 2026: OʻRQ-1184 (`lex.uz/uz/docs/8548754`)
- **New uz and ru copy is marked `// UNVERIFIED (drafted <date>)`** and merges only after the owner's read. Video captions are uz first, then ru.
- **Page dates.** Every page whose content changes gets `updated` bumped in `PAGE_PATHS`. New pages get an entry.
- **Commits** use explicit paths and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Merging and pushing are owner-only**, on the words "merge into main and push".
- **Web tests read the engine's built `dist/`.** Run `pnpm --filter @alfavit/engine build` first.

## Review Focus

1. **The tricky-cases page in production shows what the converter does today.** If an engine change alters an output, a test fails before deploy, rather than the page quietly showing a new output. → Task 1.
2. **Inputs with apostrophe variants, tutuq and Cyrillic render correctly in the prerendered HTML.** The curly and straight quotes appear as typed, not normalized, in the "input" column. → Task 1.
3. **The `FAQPage` schema on `/alphabet` contains exactly the visible questions and answers.** Google requires FAQ content to be visible. → Task 2.
4. **The chart's `ImageObject` on `/reform` and the keyboard guide points at the same locale's PNG, with alt text in that language.** → Task 3.
5. **Breadcrumb names are short labels, not full `<title>`s, on the guides and `/files`.** → Task 4.

---

### Task 1: The tricky-cases page (B3)

**Files:**
- Create: `apps/web/src/content/guides/trickyCases.ts`
- Create: `apps/web/src/pages/GuideTrickyCasesPage.tsx`
- Modify: `apps/web/src/router.tsx`; `apps/web/src/seo/config.ts` (new `PAGE_PATHS` entry `{ path: 'guide/tricky-cases', priority: 0.6, locales: LOCALES, … }`)
- Modify: `apps/web/src/i18n/translations.ts` (`meta.guide.tricky.title/desc`, `guides.tricky`, three locales)
- Modify: `apps/web/src/components/GuidePage.tsx` (a link to the tricky-cases page under the steps on the two conversion guides), `apps/web/src/seo/llms.ts` (one Pages line)
- Test: `apps/web/src/tests/TrickyCases.test.tsx` (new); `apps/web/src/tests/guides-build.test.ts` (dist)

**Interfaces:**
- Produces:
  - `TRICKY_GROUPS: { id: string; inputs: string[] }[]` (locale-independent)
  - `TRICKY_EXPECTED: Record<string, string>` (input → output)
  - `trickyCases: Record<Locale, { title: string; intro: string; groups: Record<string, { heading: string; note: string }>; inputLabel: string; outputLabel: string }>`
- Consumes: `transliterate` from `@alfavit/engine`.

The groups and inputs, all verified on engine 0.2.0 on 22 Oct:

| id | inputs | expected |
|--|--|--|
| s-h | Ishoq, Is'hoq, Mushafni | Ishoq, Ishoq, Mushafni |
| apostrophes | o'zbek, o’zbek, o‘zbek, o`zbek, g'oya | özbek ×4, ğoya |
| tutuq | маъно, санъат, ma'no | maʼno, sanʼat, maʼno |
| ng | ming, tong, dengiz | unchanged |
| capitals | SHAHAR, Shahar, O‘ZBEKISTON, CHOY | ŞAHAR, Şahar, ÖZBEKISTON, ÇOY |
| mixed | Тошкент va Samarqand | Toşkent va Samarqand |
| cyrillic-e | ер, телефон, поезд, Европа | yer, telefon, poyezd, Yevropa |
| cyrillic-ts | цирк, милиция | sirk, milisiya |
| addresses | www.shahar.uz, info@choy.uz, @shahar_news | unchanged |
| foreign | Washington, Facebook’da | Washington, Facebookʼda |

Title targets:
- uz: "yangi alifboga oʻgirish: qiyin holatlar"
- ru: "сложные случаи перевода на новый узбекский алфавит"
- en: "tricky cases when converting to the new Uzbek alphabet"

Each group note says what Alfavit does in one or two sentences. Examples:
- cyrillic-e: "Alfavit writes е as ye at the start of a word and after a vowel, and as e after a consonant."
- cyrillic-ts: "ц becomes s; the API marks c as an alternative."

- [ ] **Step 1: Write the failing tests**

```tsx
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { transliterate } from '@alfavit/engine'
import { renderWithLocale } from './renderApp'
import { TRICKY_GROUPS, TRICKY_EXPECTED } from '../content/guides/trickyCases'
import { GuideTrickyCasesPage } from '../pages/GuideTrickyCasesPage'

test('every case shows what the engine does today', () => {
  for (const { inputs } of TRICKY_GROUPS) {
    for (const input of inputs) expect(transliterate(input).text, input).toBe(TRICKY_EXPECTED[input])
  }
})

test('the page renders every input as typed, next to its output', () => {
  const { container } = renderWithLocale(<GuideTrickyCasesPage />, '/en')
  const rows = [...container.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent))
  const all = TRICKY_GROUPS.flatMap((g) => g.inputs)
  expect(rows).toHaveLength(all.length)
  for (const input of all) expect(rows).toContainEqual([input, TRICKY_EXPECTED[input]])
})

test('no competitor and no "rule" claim', () => {
  const { container } = renderWithLocale(<GuideTrickyCasesPage />, '/en')
  expect(container.textContent).not.toMatch(/alifbochi|tadqiq|translit\.uz|uzoffice|rule/i)
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @alfavit/engine build && pnpm --dir apps/web exec vitest run src/tests/TrickyCases.test.tsx`
Expected: FAIL. The modules don't exist.

- [ ] **Step 3: Implement the content module, the page, the route, `PAGE_PATHS`, the translations, the guide links and the `llms.txt` line.**
  - The page is H1 → intro → for each group, an `<h2>` heading, the note, and a two-column table (input, output).
  - Outputs come from `transliterate(input).text` at render.
  - `Seo` with `articleLd`.

- [ ] **Step 4: Run the web suite, the build and the build-output suite**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web build && pnpm --dir apps/web test:dist`
Expected: PASS. Add to `guides-build.test.ts`: `dist/guide/tricky-cases.html` contains `o’zbek` and `www.shahar.uz`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/content/guides/trickyCases.ts apps/web/src/pages/GuideTrickyCasesPage.tsx apps/web/src/router.tsx apps/web/src/seo/config.ts apps/web/src/i18n/translations.ts apps/web/src/components/GuidePage.tsx apps/web/src/seo/llms.ts apps/web/src/tests/TrickyCases.test.tsx apps/web/src/tests/guides-build.test.ts
git commit -m "feat(web): /guide/tricky-cases, what simple letter-swaps get wrong"
```

### Task 2: Answer-first sections on /alphabet (B4)

Builder's calls on scope:
- **The answers go on `/alphabet` only.** The spec says `/alphabet` and `/reform`, but these questions are alphabet-intent; `/reform` gets the chart (Task 3) and already links here.
- **"lotin alifbosi yozma harflar" (cursive letters) is left out.** A real answer needs handwritten letterforms, including Ö, Ğ, Ş and Ç, which is an artwork task rather than copy. It is noted as a separate idea for a printable handwriting worksheet.

**Files:**
- Modify: `apps/web/src/pages/AlphabetPage.tsx` (sections and FAQ JSON-LD)
- Modify: `apps/web/src/i18n/translations.ts` (new `alphabet.qa.*` keys, three locales)
- Modify: `apps/web/src/seo/config.ts` (`alphabet` updated)
- Test: `apps/web/src/tests/AlphabetPage.test.tsx`; `apps/web/src/tests/seo-head.test.ts` (dist)

Three new sections, each an `<h2>` and one or two sentences, placed after the existing "how many letters" section:
1. **When was the Latin alphabet adopted?** In 1993 (Law 931-XII, 2 Sep 1993), revised in 1995 (Law 71-I, 6 May 1995: 26 letters plus 3 letter combinations), and reformed in 2026 (OʻRQ-1184: 28 letters plus the tutuq, in force 22 Apr 2027).
2. **What was the old Latin alphabet?** The 1995 alphabet: 26 letters including Oʻ and Gʻ, the combinations Sh, Ch and Ng, and the tutuq. Oʻ, Gʻ, Sh and Ch became Ö, Ğ, Ş and Ç; ng stopped being a separate letter.
3. **How do I type Ö on a phone?** The two-line answer (the Turkish keyboard has Ö, Ğ, Ş, Ç; long-press o), with a link to the keyboard guide.

The existing chart section's heading also gets the search words "jadvali" and "rasmi" (uz), with ru and en equivalents.

The FAQ JSON-LD on `/alphabet` lists the existing count question plus these three, built from the same translation keys as the visible text.

- [ ] **Step 1: Write the failing tests**

```tsx
test('the alphabet page answers when, what before, and how to type Ö — visibly', () => {
  renderWithLocale(<AlphabetPage />, '/en')
  for (const q of [/When was the Latin alphabet adopted/i, /old Latin alphabet/i, /type Ö/i]) {
    expect(screen.getByRole('heading', { level: 2, name: q })).toBeInTheDocument()
  }
  expect(screen.getByText(/931-XII/)).toBeInTheDocument()
  expect(screen.getByText(/71-I/)).toBeInTheDocument()
})
```

In `seo-head.test.ts` (dist):

```ts
test('/alphabet FAQPage carries exactly the visible questions', () => {
  const html = dist('alphabet.html')
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"FAQPage".*?)<\/script>/)![1])
  const qs = ld.mainEntity.map((e: { name: string }) => e.name)
  expect(qs).toHaveLength(4)
  for (const q of qs) expect(html).toContain(`>${q}</h2>`)
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --dir apps/web exec vitest run src/tests/AlphabetPage.test.tsx`
Expected: FAIL. The headings are not found.

- [ ] **Step 3: Add the sections, the keys, the FAQ JSON-LD and the page date.**

- [ ] **Step 4: Run the web suite, the build and the build-output suite**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web build && pnpm --dir apps/web test:dist`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/AlphabetPage.tsx apps/web/src/i18n/translations.ts apps/web/src/seo/config.ts apps/web/src/tests/AlphabetPage.test.tsx apps/web/src/tests/seo-head.test.ts
git commit -m "feat(web): /alphabet answers when it was adopted, what came before, and how to type Ö"
```

### Task 3: The chart on /reform and the keyboard guide (B6)

**Files:**
- Create: `apps/web/src/components/ChartFigure.tsx` (the chart `<figure>` from AlphabetPage: image with localized alt, PNG and PDF links, caption)
- Modify: `apps/web/src/seo/jsonld.ts` (`chartImageLd(locale: Locale): object`, the `ImageObject` currently inline in AlphabetPage, with `caption` added)
- Modify: `apps/web/src/pages/AlphabetPage.tsx` (use both; no visible change)
- Modify: `apps/web/src/pages/ReformPage.tsx` (figure after the letter changes, plus `chartImageLd`)
- Modify: `apps/web/src/components/GuidePage.tsx` (optional `chart?: boolean`) and `apps/web/src/pages/GuideKeyboardPage.tsx` (passes it)
- Modify: `apps/web/src/seo/config.ts` (`reform` and `guide/keyboard` updated)
- Test: `apps/web/src/tests/ChartFigure.test.tsx` (new); `apps/web/src/tests/seo-head.test.ts` (dist)

**Interfaces:**
- Produces: `ChartFigure()`, a component with no props that reads the locale, and `chartImageLd(locale)`.

- [ ] **Step 1: Write the failing tests**

```tsx
test.each([['/en/reform', '/chart/uzbek-latin-alphabet-2026.png'], ['/reform', '/chart/lotin-alifbosi-jadvali-2026.png'], ['/ru/guide/keyboard', '/chart/uzbekskiy-alfavit-2026.png']])(
  '%s shows the chart for its language', (path, png) => {
    const { container } = renderApp(path)
    const img = container.querySelector(`img[src="${png}"]`)
    expect(img).not.toBeNull()
    expect(img!.getAttribute('alt')!.length).toBeGreaterThan(20)
  })
```

In `seo-head.test.ts` (dist):

```ts
test.each([['en/reform.html', 'uzbek-latin-alphabet-2026.png'], ['guide/keyboard.html', 'lotin-alifbosi-jadvali-2026.png']])(
  '%s declares the chart ImageObject for its language', (file, png) => {
    const html = dist(file)
    expect(html).toContain('"@type":"ImageObject"')
    expect(html).toContain(`"contentUrl":"https://alfavit.uz/chart/${png}"`)
  })
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --dir apps/web exec vitest run src/tests/ChartFigure.test.tsx`
Expected: FAIL. There is no image on `/reform` or the keyboard guide.

- [ ] **Step 3: Extract `ChartFigure` and `chartImageLd`; use them on all three pages; bump the dates.**

- [ ] **Step 4: Run the web suite, the build and the build-output suite**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web build && pnpm --dir apps/web test:dist`
Expected: PASS. The existing `/alphabet` dist assertions still hold.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ChartFigure.tsx apps/web/src/seo/jsonld.ts apps/web/src/pages/AlphabetPage.tsx apps/web/src/pages/ReformPage.tsx apps/web/src/components/GuidePage.tsx apps/web/src/pages/GuideKeyboardPage.tsx apps/web/src/seo/config.ts apps/web/src/tests/ChartFigure.test.tsx apps/web/src/tests/seo-head.test.ts
git commit -m "feat(web): the printable chart on /reform and the keyboard guide"
```

### Task 4: Week-2 leftovers

**Files:**
- Modify: `apps/web/src/components/GuidePage.tsx` and the three guide pages. Pass `breadcrumbName` from a `guides.*` link label instead of the full title: `guides.cyrillic`, `guides.oldlatin`, `guides.keyboard`, `guides.tricky`.
- Modify: `apps/web/src/pages/FilesPage.tsx` (`breadcrumbName={t('nav.files')}`) and `apps/web/src/components/FileConverter.tsx` (a one-line hint: old .doc files must be saved as .docx first; three locales)
- Modify: `apps/web/src/components/GuidePage.tsx` or `GuideCyrillicPage.tsx`. The Cyrillic guide links to `/kirill` (absolute, with the Cyrillic link text from `content/kirill.ts`) in every locale.
- Modify: `apps/web/src/i18n/translations.ts` (the hint; any missing `guides.*` labels)
- Test: `apps/web/src/tests/breadcrumbs.test.ts` (dist) and additions to `GuideConverter.test.tsx` and `FilesPage.test.tsx`

- [ ] **Step 1: Write the failing tests**
  - In dist: the BreadcrumbList second item on `guide/cyrillic-to-latin.html`, `guide/old-latin-to-new.html` and `files.html` does not contain `Alfavit`, `|` or `—`.
  - In units:
    - The Cyrillic guide at `/`, `/ru` and `/en` has `a[href="/kirill"]`.
    - `/files` mentions `.doc`.
- [ ] **Step 2: Run them to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run `pnpm --dir apps/web test && pnpm --dir apps/web build && pnpm --dir apps/web test:dist`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git commit -m "fix(web): short breadcrumbs, /kirill from the Cyrillic guide, a .doc hint on /files"
```

(Explicit paths, as above.)

### Task 5: Caption scripts for the three clips (C3)

**Files:**
- Create: `docs/marketing/clips-2026-10.md`

There is no test; this is a document for the owner. Three clips of about 30 seconds each, screen-only with captions. For each clip:
- what to record, step by step, on which device and which page
- captions in Uzbek first, then Russian, each as up to 6 timed lines of no more than 42 characters
- the end card text
- the link, with `utm_source=telegram|instagram&utm_medium=post&utm_campaign=clips-2026-10`

The clips:
1. **Typing Ö, Ğ, Ş, Ç on a phone.** Add the Turkish keyboard, long-press the letters, and turn off autocorrect. Link: `/guide/keyboard`.
2. **Converting a Word document.** On `/files`: drop a .docx, download it, open it. Link: `/files`.
3. **The 22 April countdown.** `/status` with the countdown, then the converter. Link: `/status`.

Claims stay within what is true today. In particular, there is no promise that typed web addresses are protected in the desktop app.

- [ ] **Step 1: Write the document. Commit it.**

```bash
git add docs/marketing/clips-2026-10.md
git commit -m "docs(marketing): caption scripts for three 30-second clips (owner records)"
```

### Task 6: Whole-repo check and the owner's review

- [ ] **Step 1:** Run `pnpm --filter @alfavit/engine build && pnpm turbo run test --force && pnpm --dir apps/web build && pnpm --dir apps/web test:dist`. Expected: everything passes, uncached.
- [ ] **Step 2: One message to the owner.** It carries:
  - a generated file of every new UNVERIFIED uz and ru string, by page
  - the clip scripts to record
  - the request for "merge into main and push"
