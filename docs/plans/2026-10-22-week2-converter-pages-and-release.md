# Week 2: Converter-First Pages and the 0.2.0 Release — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a converter at the top of every page people reach by searching "convert". Give Cyrillic readers a page in their script. Ship the week-1 engine fixes to the npm package, the Chrome extension and the desktop apps.

**Architecture:**
- **Pages.**
  - `GuidePage` gains an optional converter slot, used by both conversion guides.
  - `/files` gets a real H1 aimed at Word documents.
  - A new Uzbek-only route `/kirill` holds one page written in Uzbek Cyrillic. It has its own content module and an `uz-Cyrl` language attribute.
- **Release.** Version bumps and artefacts are prepared on this branch. The publish, the store submission and the desktop tag happen after the owner merges, from `main`.

**Tech Stack:** React + `vite-react-ssg` (apps/web), esbuild extension build (apps/extension), Tauri 2 (apps/desktop), TypeScript engine (packages/engine), Vitest.

**Spec:** `docs/specs/2026-10-22-search-llm-visibility-design.md`. This plan covers workstreams B1, B1b, B2 and E4.

## Global Constraints

- **Uzbek and Russian copy merges only after the owner has read it.**
  - Mark every new or changed uz and ru string `// UNVERIFIED (drafted <date>)`, the convention already in `translations.ts`.
  - The final task lists every one of them for the owner.
- **Page dates.** Every page whose content changes gets `updated` bumped in `PAGE_PATHS` (`apps/web/src/seo/config.ts`).
- **Pages that change keep their URLs:** `/guide/cyrillic-to-latin`, `/guide/old-latin-to-new`, `/files`.
- **Converter tracking is unchanged.** `<Converter compact />` reports `transliterate` once per mount, with the page path, and never sends text.
- **Release versions:**
  - `@alfavit/engine` becomes `0.2.0`, in `package.json` and in `src/index.ts`'s `version`.
  - The extension manifest becomes `0.2.0`.
  - Desktop becomes `0.3.1` in all four files: `apps/desktop/package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` and `Cargo.lock`.
  - `@alfavit/sdk` does not bundle the engine and is not bumped.
- **The release waits for the old-Latin speed fix** (session "Fix slow old-Latin conversion on long input"). It must be merged into `main` before anything is published or tagged.
- **Owner-only actions.** The agent never runs these; they wait for the owner's own words:
  - merge and push
  - `npm publish` (OTP)
  - pushing the `desktop-v0.3.1` tag
  - the Chrome Web Store upload
- **Commits** use explicit paths and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Web tests read the engine's built `dist/`.** Run `pnpm --filter @alfavit/engine build` before `apps/web` tests.

## Review Focus

1. **A visitor converts on a guide page and the event shows that page's path** (`/guide/cyrillic-to-latin`), not `/`. → Task 1.
2. **`/kirill` exists only in Uzbek.** `/ru/kirill` and `/en/kirill` return the 404 page, and the sitemap lists `/kirill` with no ru or en alternates. → Task 3.
3. **The Cyrillic page declares `lang="uz-Cyrl"`** in the prerendered HTML and `inLanguage: "uz-Cyrl"` in its schema, so search engines don't read it as Latin Uzbek. → Task 3.
4. **The keyboard guide does not get a converter.** It is about typing, and a second text box would confuse. → Task 1.
5. **The extension zip has the manifest at its root, at version 0.2.0, and contains the week-1 engine.** → Task 5.

---

### Task 1: Converter on the two conversion guides (B1)

**Files:**
- Modify: `apps/web/src/components/GuidePage.tsx`
- Modify: `apps/web/src/pages/GuideCyrillicPage.tsx` and `apps/web/src/pages/GuideOldLatinPage.tsx` (pass the new prop)
- Modify: `apps/web/src/content/guides/cyrillicToLatin.ts` and `oldLatinToNew.ts` (titles)
- Modify: `apps/web/src/i18n/translations.ts` (`meta.guide.cyrillic.*` and `meta.guide.oldlatin.*`, three locales each)
- Modify: `apps/web/src/seo/config.ts` (`updated` for both guides)
- Test: `apps/web/src/tests/GuideConverter.test.tsx` (new). Update `apps/web/src/tests/guides-build.test.ts` to read titles from the content modules instead of literals.

**Interfaces:**
- Produces: `GuidePage` takes an optional `converter?: boolean` prop, default `false`. When true, it renders `<Converter compact />` directly under the intro paragraph and above the letters and steps.

Target titles. The owner fixes the wording in review; the search phrase in each must survive.

| | Page H1 (`guide.title`) | `<title>` |
|--|--|--|
| cyrillic, uz | Kirilldan yangi lotinga oʻgirish | Kirilldan yangi lotinga oʻgirish — onlayn konvertor \| Alfavit |
| cyrillic, ru | Перевод узбекского текста с кириллицы на новую латиницу | Кириллица → новая латиница: онлайн-конвертер узбекского текста \| Alfavit |
| cyrillic, en | Convert Uzbek Cyrillic to the new Latin | Uzbek Cyrillic to new Latin — online converter \| Alfavit |
| old-latin, uz | Eski lotindan yangi alifboga oʻgirish | Eski lotindan yangi alifboga oʻgirish — onlayn konvertor \| Alfavit |
| old-latin, ru | Со старой латиницы на новый узбекский алфавит | Старая латиница → новый узбекский алфавит: конвертер \| Alfavit |
| old-latin, en | Convert old Latin to the new Uzbek alphabet | Old Latin to the new Uzbek alphabet — online converter \| Alfavit |

Descriptions (`meta.guide.*.desc`) say the converter is on the page and the step-by-step rules are below, mention Ö, Ğ, Ş, Ç, and stay under 160 characters.

- [ ] **Step 1: Write the failing tests**

```tsx
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderWithLocale } from './renderApp'
import { GuideCyrillicPage } from '../pages/GuideCyrillicPage'
import { GuideOldLatinPage } from '../pages/GuideOldLatinPage'
import { GuideKeyboardPage } from '../pages/GuideKeyboardPage'

test.each([
  ['Cyrillic guide', GuideCyrillicPage],
  ['old-Latin guide', GuideOldLatinPage],
])('the %s puts the converter before the steps', (_name, Page) => {
  const { container } = renderWithLocale(<Page />, '/en')
  const input = container.querySelector('#converter-input')
  const firstStep = container.querySelector('ol')
  expect(input).not.toBeNull()
  expect(input!.compareDocumentPosition(firstStep!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('the keyboard guide has no converter', () => {
  const { container } = renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(container.querySelector('#converter-input')).toBeNull()
})

test('the uz titles carry the search phrases', () => {
  renderWithLocale(<GuideCyrillicPage />, '/')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kirilldan yangi lotinga')
})

test('a conversion on the guide is reported with the guide\'s path', async () => {
  window.history.pushState({}, '', '/guide/cyrillic-to-latin')
  const sendBeacon = vi.fn().mockReturnValue(true)
  Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true })
  const user = userEvent.setup()
  const { container } = renderWithLocale(<GuideCyrillicPage />, '/')
  await user.type(container.querySelector('#converter-input')!, 'салом')
  const body = JSON.parse(sendBeacon.mock.calls.find(([, b]) => JSON.parse(b).e === 'transliterate')![1])
  expect(new URL(body.u).pathname).toBe('/guide/cyrillic-to-latin')
  expect(body).not.toHaveProperty('text')
})
```

(Imports for this test: `vi` from vitest and `userEvent` from `@testing-library/user-event`, as in `converterTracking.test.tsx`.)

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @alfavit/engine build && pnpm --dir apps/web exec vitest run src/tests/GuideConverter.test.tsx`
Expected: FAIL. `#converter-input` is null on both guides, and the uz H1 is "Kirill alifbosidan yangi lotinga oʻgirish".

- [ ] **Step 3: Add the `converter` prop to `GuidePage`; pass it from both guide pages; update the titles, metas and page dates.**

- [ ] **Step 4: Run the web suite and the build-output suite**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web test:dist`
Expected: PASS, after `guides-build.test.ts` reads `cyrillicToLatin[locale].title` and `oldLatinToNew[locale].title` instead of literals.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/GuidePage.tsx apps/web/src/pages/GuideCyrillicPage.tsx apps/web/src/pages/GuideOldLatinPage.tsx apps/web/src/content/guides/cyrillicToLatin.ts apps/web/src/content/guides/oldLatinToNew.ts apps/web/src/i18n/translations.ts apps/web/src/seo/config.ts apps/web/src/tests/GuideConverter.test.tsx apps/web/src/tests/guides-build.test.ts
git commit -m "feat(web): the conversion guides open with the converter"
```

### Task 2: /files for Word documents (B1b)

**Files:**
- Modify: `apps/web/src/components/FileConverter.tsx` (its title becomes the page's `<h1>`; `/files` is its only user)
- Modify: `apps/web/src/i18n/translations.ts` (`file.title` and `meta.files.*`, three locales)
- Modify: `apps/web/src/seo/config.ts` (`updated` for `files`)
- Test: `apps/web/src/tests/FilesPage.test.tsx` (new)

Target copy:

| | H1 (`file.title`) | `<title>` |
|--|--|--|
| uz | Word hujjatini yangi alifboga oʻgirish | Word hujjatini yangi alifboga oʻgirish — .docx, .txt, .srt \| Alfavit |
| ru | Перевести документ Word на новый узбекский алфавит | Документ Word на новый узбекский алфавит — .docx, .txt, .srt \| Alfavit |
| en | Convert a Word document to the new Uzbek alphabet | Word document to the new Uzbek alphabet — .docx, .txt, .srt \| Alfavit |

- [ ] **Step 1: Write the failing test**

```tsx
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderWithLocale } from './renderApp'
import { FilesPage } from '../pages/FilesPage'

test('/files has one H1, and it names Word documents', () => {
  renderWithLocale(<FilesPage />, '/en')
  const h1s = screen.getAllByRole('heading', { level: 1 })
  expect(h1s).toHaveLength(1)
  expect(h1s[0]).toHaveTextContent('Word document')
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --dir apps/web exec vitest run src/tests/FilesPage.test.tsx`
Expected: FAIL. No H1 is found.

- [ ] **Step 3: Change FileConverter's title from `<h2>` to `<h1>`; update `file.title`, the metas and the page date.**

- [ ] **Step 4: Run the web suite**

Run: `pnpm --dir apps/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/FileConverter.tsx apps/web/src/i18n/translations.ts apps/web/src/seo/config.ts apps/web/src/tests/FilesPage.test.tsx
git commit -m "feat(web): /files gets an H1, aimed at Word documents"
```

### Task 3: One page in Uzbek Cyrillic (B2)

**Files:**
- Create: `apps/web/src/content/kirill.ts`, with all copy in Uzbek Cyrillic, marked UNVERIFIED
- Create: `apps/web/src/pages/KirillPage.tsx`
- Modify: `apps/web/src/router.tsx`, adding `{ path: 'kirill', Component: KirillPage }`
- Modify: `apps/web/src/seo/config.ts`, adding a `PAGE_PATHS` entry `{ path: 'kirill', priority: 0.7, locales: ['uz'], published: <today>, updated: <today> }`
- Modify: `apps/web/src/components/Seo.tsx`, adding an optional `lang?: string` prop that overrides `<html lang>`
- Modify: `apps/web/src/seo/jsonld.ts`, so `articleLd` accepts an optional `inLanguage` override
- Modify: `apps/web/src/pages/AlphabetPage.tsx`, with a link to `/kirill` in its links row (Cyrillic text)
- Modify: `apps/web/src/seo/llms.ts`, adding one line under `## Pages`
- Test: `apps/web/src/tests/KirillPage.test.tsx` (new), plus additions to `apps/web/src/tests/seo-head.test.ts` and `apps/web/src/tests/seo.test.ts`

**Interfaces:**
- Produces: `kirill: { title: string; intro: string; lettersHeading: string; qa: { q: string; a: string }[] }`, exported from `content/kirill.ts`.
- Produces: the `Seo` prop `lang?: string`, and the `articleLd` option `inLanguage?: string`.

What the page holds, in order:
1. **H1**, targeting "янги ўзбек алифбоси" and "кириллдан янги лотинга", for example: Янги ўзбек алифбоси: кириллдан янги лотинга ўгириш.
2. **A one-paragraph intro** in Cyrillic: paste Cyrillic text and get the 2026 alphabet.
3. **`<Converter compact />`.**
4. **The four changed letters as a table**, Cyrillic → new Latin (Ў→Ö, Ғ→Ğ, Ш→Ş, Ч→Ç), built from `LETTERS.filter(l => l.changed)`.
5. **Q&A**, each answer drawing its facts from `status.ts` and `LETTERS`:
   - "Янги алифбо қачон кучга киради?", with the date from `IN_FORCE_LABEL` facts (22 апрель 2027) and the law number ЎРҚ-1184
   - "Янги алифбода нечта ҳарф бор?" (28 and the tutuq)
   - "Кирилл ёзувидаги ҳужжатлар кучини йўқотадими?" (no; from `STATUS_COPY`)
6. **Links** to `/alphabet` and `/status`.

- [ ] **Step 1: Write the failing tests**

```tsx
// KirillPage.test.tsx
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from './renderApp'

test('/kirill is a Cyrillic page with the converter', () => {
  const { container } = renderApp('/kirill')
  expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/[Ѐ-ӿ]/)
  expect(container.querySelector('#converter-input')).not.toBeNull()
  expect(screen.getByText(/2027/)).toBeInTheDocument()
})

test.each(['/ru/kirill', '/en/kirill'])('%s is not a page', (path) => {
  renderApp(path)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/404|not found|topilmadi|не найдена/i)
})
```

In `seo-head.test.ts` (dist):

```ts
test('/kirill is prerendered as Uzbek Cyrillic', () => {
  const html = dist('kirill.html')
  expect(html).toMatch(/<html[^>]*lang="uz-Cyrl"/)
  expect(html).toContain('"inLanguage":"uz-Cyrl"')
})
```

In `seo.test.ts`:

```ts
test('/kirill is in the sitemap with no ru or en alternate', () => {
  const xml = generateSitemapXml()
  expect(xml).toContain('<loc>https://alfavit.uz/kirill</loc>')
  expect(xml).not.toContain('https://alfavit.uz/ru/kirill')
  expect(xml).not.toContain('https://alfavit.uz/en/kirill')
})
```

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `pnpm --dir apps/web exec vitest run src/tests/KirillPage.test.tsx src/tests/seo.test.ts`
Expected: FAIL. `/kirill` renders the 404 page, and the sitemap has no `/kirill`.

- [ ] **Step 3: Implement the content module, the page, the route, the `PAGE_PATHS` entry, the `Seo` `lang` override, the `articleLd` `inLanguage` override, the `/alphabet` link and the `llms.txt` line.**

- [ ] **Step 4: Run the web suite, the build, and the build-output suite**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web build && pnpm --dir apps/web test:dist`
Expected: PASS. `dist/kirill.html` exists; `dist/ru/kirill.html` and `dist/en/kirill.html` do not.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/content/kirill.ts apps/web/src/pages/KirillPage.tsx apps/web/src/router.tsx apps/web/src/seo/config.ts apps/web/src/components/Seo.tsx apps/web/src/seo/jsonld.ts apps/web/src/pages/AlphabetPage.tsx apps/web/src/seo/llms.ts apps/web/src/tests/KirillPage.test.tsx apps/web/src/tests/seo-head.test.ts apps/web/src/tests/seo.test.ts
git commit -m "feat(web): /kirill, the converter page in Uzbek Cyrillic"
```

### Task 4: Engine 0.2.0 (E4)

**Files:**
- Modify: `packages/engine/package.json` (`"version": "0.2.0"`)
- Modify: `packages/engine/src/index.ts` (`export const version = '0.2.0'`)
- Modify: `packages/engine/README.md`: a short "0.2.0" section listing the week-1 changes (addresses left alone, s+h words, the `foreign-word` flag) and the old-Latin speed fix
- Test: `packages/engine/src/tests/index.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('the exported version matches package.json', () => {
  const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'))
  expect(version).toBe(pkg.version)
  expect(version).toBe('0.2.0')
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @alfavit/engine exec vitest run src/tests/index.test.ts`
Expected: FAIL. The version is `0.1.1`.

- [ ] **Step 3: Bump both version strings and add the README section.**

- [ ] **Step 4: Run the engine suite and its dist test**

Run: `pnpm --filter @alfavit/engine test && pnpm --filter @alfavit/engine test:dist`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/package.json packages/engine/src/index.ts packages/engine/README.md packages/engine/src/tests/index.test.ts
git commit -m "chore(engine): 0.2.0"
```

### Task 5: Extension 0.2.0 zip (E4, B7)

**Files:**
- Modify: `apps/extension/manifest.json` (`"version": "0.2.0"`)
- Create: `docs/chrome-web-store/alfavit-extension-v0.2.0.zip` (`apps/extension/dist/*`, manifest at root)
- Delete: `docs/chrome-web-store/alfavit-extension-v0.1.1.zip`
- Modify: `docs/chrome-web-store/LISTING.md` (every `v0.1.1.zip` reference becomes `v0.2.0.zip`)

- [ ] **Step 1: Bump the manifest; build the engine, then the extension**

Run: `pnpm --filter @alfavit/engine build && pnpm --filter @alfavit/extension build && pnpm --filter @alfavit/extension test`
Expected: the build succeeds and the extension tests pass.

- [ ] **Step 2: Zip and verify the contents.**

Run: `(cd apps/extension/dist && zip -qr ../../../docs/chrome-web-store/alfavit-extension-v0.2.0.zip .)`. Then `unzip -l` the zip and `unzip -p … manifest.json | grep '"version"'`.
Expected:
- `manifest.json` is listed at the root.
- `"version": "0.2.0"`.
- `unzip -p … | grep -c foreign-word` ≥ 1, which shows the week-1 engine is bundled.

- [ ] **Step 3: Remove the old zip, update LISTING.md, commit**

```bash
git rm docs/chrome-web-store/alfavit-extension-v0.1.1.zip
git add apps/extension/manifest.json docs/chrome-web-store/alfavit-extension-v0.2.0.zip docs/chrome-web-store/LISTING.md
git commit -m "chore(extension): 0.2.0 zip with the week-1 engine, for the store submission"
```

### Task 6: Desktop 0.3.1 (E4) — prepared here, tagged after the owner merges

**Files:**
- Modify: `apps/desktop/package.json`, `apps/desktop/src-tauri/tauri.conf.json`, `apps/desktop/src-tauri/Cargo.toml` and `apps/desktop/src-tauri/Cargo.lock` (`alfavit-desktop` entry), all to `0.3.1`

- [ ] **Step 1: Bump all four and run the desktop tests**

Run: `pnpm --filter @alfavit/engine build && pnpm --filter @alfavit/desktop test && grep -rn '0\.3\.1' apps/desktop/package.json apps/desktop/src-tauri/tauri.conf.json apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/Cargo.lock`
Expected: the tests pass, and exactly four version lines show 0.3.1 (Cargo.lock's line is under `name = "alfavit-desktop"`).

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/package.json apps/desktop/src-tauri/tauri.conf.json apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/Cargo.lock
git commit -m "chore(desktop): 0.3.1 — bundles engine 0.2.0"
```

- [ ] **Step 3 (after the owner merges this branch and the speed fix, and says "tag desktop 0.3.1"): tag and build.** `git tag desktop-v0.3.1 <main sha> && git push origin desktop-v0.3.1`. Wait for the Desktop Release workflow, about 20 minutes.

- [ ] **Step 4: Host and verify the installers**
  - `gh release download desktop-v0.3.1 --pattern '*.dmg' --pattern '*-setup.exe'`.
  - Copy the files over `apps/web/public/download/Alfavit.dmg` and `apps/web/public/download/Alfavit-Setup.exe`, keeping those exact names.
  - Verify the dmg: `CFBundleShortVersionString` is 0.3.1, `codesign -dv` says adhoc, and `lipo -archs` shows `x86_64 arm64`.
  - Verify the exe: its sha256 matches the release asset.
  - Commit the two files. The owner merges and pushes, then posts a "please re-download" note (Claude drafts it).

### Task 7: Draft the Wikipedia facts edit (C4)

**Files:**
- Create: `docs/marketing/wikipedia-ozbek-lotin-alifbosi-draft.md`

Draft the additions to uz.wikipedia "Oʻzbek lotin alifbosi", in Uzbek, for the owner to paste:
- The 2026 law: OʻRQ-1184, signed and published 21 Oct 2026, in force 22 Apr 2027.
- The 28 letters and the tutuq, in the law's order.
- The four changed letters and the ng change.
- What stays valid (documents, currency, securities) and the textbook timeline.

Every sentence carries a citation to lex.uz/uz/docs/8548754 or a named news outlet (Gazeta, Kun.uz, Daryo), in Wikipedia's `<ref>` format. There is no link to alfavit.uz anywhere. Mark the file UNVERIFIED for the owner's read. There is no test; the owner reviews it with Task 8's message.

- [ ] **Step 1: Write the draft. Commit it.**

```bash
git add docs/marketing/wikipedia-ozbek-lotin-alifbosi-draft.md
git commit -m "docs(marketing): Wikipedia facts draft for the 2026 alphabet law (owner edits)"
```

### Task 8: Whole-repo check and the owner's review

- [ ] **Step 1:** Run `pnpm --filter @alfavit/engine build && pnpm turbo run test --force && pnpm --dir apps/web build && pnpm --dir apps/web test:dist`. Expected: everything passes, uncached.
- [ ] **Step 2: One message to the owner.** It contains:
  - every UNVERIFIED uz and ru string added this week, by page
  - the Wikipedia draft from Task 7, to read and paste under the owner's own account
  - the release checklist in order: merge the speed fix → merge this branch → `pnpm --filter @alfavit/engine publish --no-git-checks` (OTP) → say "tag desktop 0.3.1" → upload `alfavit-extension-v0.2.0.zip` per LISTING.md → paste the store URL into `EXTENSION_STORE_URL` once Google approves
  - the request for "merge into main and push"
