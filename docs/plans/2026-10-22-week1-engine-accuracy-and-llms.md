# Week 1: Engine Accuracy and llms Files — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the engine from rewriting web addresses, s+h words and obviously foreign words. Give language models a full, citable text of the site.

**Architecture:**
- **Engine.** `transliterate()` first cuts out protected spans (URLs, domains, emails, @handles) and passes them through unchanged. It converts the text between them with the existing per-run pipeline. Inside that pipeline, old-Latin runs first check a sourced s+h stem list, then a foreign-letter test, then fall back to `convertOldLatin`.
- **Web.** `llms.txt` gains a Tools section. A new generator writes `llms-full.txt` from the same content modules the pages render.

**Tech Stack:** TypeScript (ESM, no dependencies) in `packages/engine`; Vite + `vite-react-ssg` build plugin in `apps/web`; Vitest throughout.

**Spec:** `docs/specs/2026-10-22-search-llm-visibility-design.md`. This plan covers workstreams E1, E2, the interim rule from E3, and B5.

## Global Constraints

- **Engine public API is unchanged:** `transliterate(input, options?) → { text, segments, flags }`.
  - `segments` still tile the input exactly: concatenating every `source` gives the input, and concatenating every `output` gives `text`.
  - Every flag's `start`/`end` index into the original input.
- **The engine stays dependency-free, ESM only, offline.** `node-esm-build.test.ts` must keep passing.
- **Existing flag reasons keep their names** (`cyrillic-e-position`, `cyrillic-ts`). The one new reason is `'foreign-word'`.
- **Every s+h list entry carries its Cyrillic source.** The expected output is whatever the engine's own Cyrillic path produces for that source; it is never hand-typed.
- **Foreign names other than the w / bare-c rule stay converted** (E3 is deferred). `Shakespeare → Şakespeare` is pinned on purpose.
- **Week 1 ends at a tested branch.**
  - Nothing merges or pushes without the owner's words "merge into main and push".
  - npm publishing, the extension zip and the desktop installers are week 2 (E4).
- Commits use explicit paths and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Web tests read the engine's built `dist/`.** Run `pnpm --filter @alfavit/engine build` before any `apps/web` test.

## Review Focus

1. **A URL at the end of a sentence or inside brackets**, e.g. `(https://choy.uz/sh).`. The URL is untouched; the closing bracket and full stop are not swallowed into it. → Task 1.
2. **Cyrillic text after a protected span** still gets flags at the right offsets. → Task 1.
3. **Telegram and X handles** (`@shahar_news`) stay unchanged. → Task 1.
4. **Case** is preserved for list words: `ISHOQ` stays all caps, `Ishoqning` stays title case. → Task 2.
5. **Everyday ş-words that share letters with list stems stay ş**: `ishonch`, `kishi`, `tashib`, `tashqi`, `ishla`, `boshi`. → Task 2.

---

### Task 1: Leave URLs, domains, emails and handles unchanged (E1)

**Files:**
- Create: `packages/engine/src/protect.ts`
- Modify: `packages/engine/src/transliterate.ts`
- Modify: `packages/engine/README.md` (Design notes)
- Test: `packages/engine/src/tests/protect.test.ts`

**Interfaces:**
- Produces: `findProtectedSpans(text: string): Array<{ start: number; end: number }>`. Spans are sorted, non-overlapping, and merged where they touch.
- Produces (internal, `transliterate.ts`): the per-run loop moves into a helper that takes `(text, offset)` and appends to `segments` and `flags`. Tasks 2 and 3 add old-Latin branches to this helper.

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'
import { findProtectedSpans } from '../protect'

const t = (s: string) => transliterate(s).text

test.each([
  ['www.shahar.uz', 'www.shahar.uz'],
  ['Sayt: https://shahar.uz/choy/oʻzbek?q=sh.', 'Sayt: https://shahar.uz/choy/oʻzbek?q=sh.'],
  ['Yozing: info@shahar.uz', 'Yozing: info@shahar.uz'],
  ['[Shahar](https://shahar.uz/sh)', '[Şahar](https://shahar.uz/sh)'],
  ['(manba: https://choy.uz/sh) choy', '(manba: https://choy.uz/sh) çoy'],
  ['shahar.uz sayti', 'shahar.uz sayti'],
  ['Kanal: @shahar_news', 'Kanal: @shahar_news'],
])('%s stays a working address', (input, expected) => {
  expect(t(input)).toBe(expected)
})

test('a dot between words without a known domain ending is still text', () => {
  expect(t('shahar.choy')).toBe('şahar.çoy')
})

test('trailing punctuation and an unmatched bracket are not part of the URL', () => {
  const input = '(https://choy.uz/sh).'
  const [span] = findProtectedSpans(input)
  expect(input.slice(span.start, span.end)).toBe('https://choy.uz/sh')
})

test('segments still tile the input, and Cyrillic flags keep their offsets after a protected span', () => {
  const input = 'сайт www.shahar.uz ва концерт'
  const r = transliterate(input)
  expect(r.segments.map((s) => s.source).join('')).toBe(input)
  expect(r.segments.map((s) => s.output).join('')).toBe(r.text)
  expect(r.text).toBe('sayt www.shahar.uz va konsert')
  const ts = r.flags.find((f) => f.reason === 'cyrillic-ts')!
  expect(input.slice(ts.start, ts.end)).toBe('ц')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @alfavit/engine exec vitest run src/tests/protect.test.ts`
Expected: FAIL. `../protect` cannot be resolved, and `www.shahar.uz` comes back as `www.şahar.uz`.

- [ ] **Step 3: Implement `findProtectedSpans` in `packages/engine/src/protect.ts`.** Collect the matches of these patterns, then sort and merge them:
  - scheme URLs (`https?://`, `ftp://`) and `www.` URLs, running to the next whitespace, `<`, `>` or `"`
  - emails (`local@domain.tld`)
  - bare domains ending in one of `uz ru com org net io dev app info me tv co gov edu kz tj kg`, with an optional `/path`
  - handles: `@` followed by 3–32 `[A-Za-z0-9_]`, not preceded by an email-local character

  After matching a URL, strip trailing `.,;:!?`. Strip a trailing `)` or `]` when the URL contains no matching opener.

- [ ] **Step 4: Wire it into `transliterate()`.** Walk the protected spans in order:
  - Each protected span becomes one segment `{ source, output: source, script: 'foreign', start, end }`.
  - Each gap goes through the existing per-run loop with `offset` added to every run's `start`/`end` and to `convertCyrillicRun`'s offset argument.

- [ ] **Step 5: Run the engine suite to verify everything passes**

Run: `pnpm --filter @alfavit/engine test`
Expected: PASS. That includes `golden.test.ts`, `tutuq-belgisi.test.ts` and `apostrophe-variants.test.ts`, which pin behaviour that must not change.

- [ ] **Step 6: Document it.** Add one sentence to `packages/engine/README.md` → Design notes: web addresses, domains, emails and @handles pass through unchanged.

- [ ] **Step 7: Commit**

```bash
git add packages/engine/src/protect.ts packages/engine/src/transliterate.ts packages/engine/src/tests/protect.test.ts packages/engine/README.md
git commit -m "fix(engine): leave web addresses, emails and @handles unchanged"
```

### Task 2: s+h words that are two sounds (E2)

**Files:**
- Modify: `packages/engine/src/dictionary.ts`
- Modify: `packages/engine/src/transliterate.ts` (old-Latin branch)
- Modify: `packages/engine/README.md` (Design notes)
- Test: `packages/engine/src/tests/s-h-words.test.ts`

**Interfaces:**
- Consumes: the per-run helper from Task 1.
- Produces:
  - `S_H_STEMS: ReadonlyArray<{ cyrillic: string; oldLatin: string }>`. Both fields are lowercase; `oldLatin` is written without the tutuq.
  - `matchSHStem(word: string): { sourceLength: number; output: string } | undefined`.
    - `sourceLength` counts characters of `word` as written, including an apostrophe variant between s and h.
    - `output` is the stem's new-Latin form, cased like the source: all caps if the source stem is all caps, capitalised if it starts with a capital, otherwise lowercase.

Initial list. The owner reviews and extends it before release; the `oldLatin` column is the 1995 spelling with the tutuq dropped:

| cyrillic | oldLatin | meaning |
|--|--|--|
| исҳоқ | ishoq | the name Isʼhoq |
| исҳол | ishol | diarrhoea |
| асҳоб | ashob | companions |
| мусҳаф | mushaf | a copy of the Qurʼan |
| тасҳиҳ | tashih | correction |

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'
import { S_H_STEMS } from '../dictionary'

const t = (s: string) => transliterate(s).text

test.each([
  ['Ishoq', 'Ishoq'], ["Is'hoq", 'Ishoq'], ['Is’hoq', 'Ishoq'], ['ISHOQ', 'ISHOQ'],
  ['Ishoqning', 'Ishoqning'], ['ishoqqa', 'ishoqqa'], ['Ishoqjon', 'Ishoqjon'],
  ['Mushafni', 'Mushafni'], ['ashob', 'ashob'], ['ishol', 'ishol'], ['tashih', 'tashih'],
])('%s keeps s and h apart', (input, expected) => {
  expect(t(input)).toBe(expected)
})

test('every stem converts the same whatever script it was typed in', () => {
  for (const { cyrillic, oldLatin } of S_H_STEMS) {
    expect(t(oldLatin), oldLatin).toBe(t(cyrillic))
    expect(cyrillic, `${cyrillic} needs сҳ as its source`).toContain('сҳ')
  }
})

test.each([
  ['ishonch', 'işonç'], ['kishi', 'kişi'], ['tashib', 'taşib'],
  ['tashqi', 'taşqi'], ['ishla', 'işla'], ['boshi', 'boşi'],
])('everyday ş-word %s still becomes ş', (input, expected) => {
  expect(t(input)).toBe(expected)
})

test('a list word raises no ambiguity flag', () => {
  expect(transliterate('Ishoq keldi').flags).toEqual([])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @alfavit/engine exec vitest run src/tests/s-h-words.test.ts`
Expected: FAIL. `Ishoq` comes back as `Işoq`, and `S_H_STEMS` is not exported.

- [ ] **Step 3: Implement `S_H_STEMS` and `matchSHStem` in `dictionary.ts`.**
  - Before comparing, drop one apostrophe variant (`APOSTROPHE_VARIANTS` from `normalize.ts`, plus ʻ and ʼ) that sits between `s` and `h`.
  - Match the longest stem that the lowercased word starts with.
  - Compute each stem's new-Latin output once at module load with `convertCyrillicRun(cyrillic, 0).output`.
  - Keep `EXCEPTIONS` and `lookupException` as they are.

- [ ] **Step 4: Use it in the old-Latin branch.** When `matchSHStem(run.text)` hits, the output is `match.output + convertOldLatin(run.text.slice(match.sourceLength))`.

- [ ] **Step 5: Run the engine suite to verify everything passes**

Run: `pnpm --filter @alfavit/engine test`
Expected: PASS.

- [ ] **Step 6: Document it.** Add one sentence to `packages/engine/README.md` → Design notes: s+h words from a sourced list (e.g. *Ishoq*, *mushaf*) keep s and h apart.

- [ ] **Step 7: Commit**

```bash
git add packages/engine/src/dictionary.ts packages/engine/src/transliterate.ts packages/engine/src/tests/s-h-words.test.ts packages/engine/README.md
git commit -m "fix(engine): keep s and h apart in Ishoq, mushaf, ashob and other listed words"
```

### Task 3: Flag obviously foreign words instead of rewriting them (E3 interim)

**Files:**
- Modify: `packages/engine/src/transliterate.ts` (old-Latin branch, after the s+h check)
- Modify: `packages/engine/README.md` (flag reasons)
- Test: `packages/engine/src/tests/foreign-words.test.ts`

**Interfaces:**
- Consumes: the per-run helper (Task 1) and the s+h check (Task 2), which runs first.
- Produces: `isForeignLatinWord(word: string): boolean`, exported from `transliterate.ts`. It is true when the lowercased word contains `w`, or contains a `c` that is not immediately followed by `h`.
  - For such a run the output is the run unchanged, plus one flag `{ start, end, chosen: run.text, alternatives: [convertOldLatin(run.text)], reason: 'foreign-word' }`.
  - No flag is raised when the alternative equals the input.

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, test } from 'vitest'
import { transliterate } from '../transliterate'

const t = (s: string) => transliterate(s).text

test('words with w or a bare c are left as written, with the converted form offered', () => {
  const r = transliterate('Washington va Chicago shahar')
  expect(r.text).toBe('Washington va Chicago şahar')
  expect(r.flags).toEqual([
    { start: 0, end: 10, chosen: 'Washington', alternatives: ['Waşington'], reason: 'foreign-word' },
    { start: 14, end: 21, chosen: 'Chicago', alternatives: ['Çicago'], reason: 'foreign-word' },
  ])
})

test('no flag when converting would change nothing', () => {
  expect(transliterate('Facebook').flags).toEqual([])
})

test('ch in an Uzbek word is still ç', () => {
  expect(t('choy')).toBe('çoy')
})

test('foreign names without w or a bare c are still converted until the spelling rules are out (E3)', () => {
  expect(t('Shakespeare')).toBe('Şakespeare')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @alfavit/engine exec vitest run src/tests/foreign-words.test.ts`
Expected: FAIL. `Washington` comes back as `Waşington`, with no flags.

- [ ] **Step 3: Implement `isForeignLatinWord` and the branch in `transliterate.ts`** as described in Interfaces.

- [ ] **Step 4: Run the engine suite to verify everything passes**

Run: `pnpm --filter @alfavit/engine test`
Expected: PASS.

- [ ] **Step 5: Document it.** In `packages/engine/README.md` → API → `flags`, add `foreign-word` to the list of reasons: a word with letters Uzbek doesn't use (w, a bare c) is left as written, and its converted form is offered as the alternative.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src/transliterate.ts packages/engine/src/tests/foreign-words.test.ts packages/engine/README.md
git commit -m "fix(engine): flag Washington and Chicago instead of rewriting them"
```

### Task 4: A Tools section in llms.txt (B5)

**Files:**
- Modify: `apps/web/src/seo/llms.ts`
- Test: `apps/web/src/tests/llms.test.ts` (new)

**Interfaces:**
- Consumes: nothing new. Keeps `generateLlmsTxt(): string`.
- Produces: the `llms-full.txt` URL is referenced here; Task 5 creates the file.

The `## Tools` section goes after `## Pages`. Its facts, which the implementer writes as one line each:
- **Web converter** (`/`, also on `/alphabet`). It detects Cyrillic or old Latin and handles:
  - apostrophe variants (ʻ ' ‘ ’ `) and capitals
  - Cyrillic е/ye and ц (flagged)
  - s+h words such as *Ishoq*
  - web addresses, emails and @handles, which it leaves unchanged
  - foreign words such as *Washington*, which it flags instead of rewriting
- **Files** (`/files`): .docx, .txt, .srt, converted in the browser.
- **Windows and Mac apps** (`/apps`): convert as you type, in any program. Link `/apps`, never `/dl/…`; a crawler following `/dl/` would be counted as an installer download.
- **Telegram:** `https://t.me/alfavit_uz_bot`. Send it text, or type `@alfavit_uz_bot` and your text in any chat (inline mode).
- **API:** `POST https://api.alfavit.uz/v1/transliterate`
  - free, no key, 60 requests / 60 s per IP, up to 100,000 characters
  - request `{"text": "..."}`, response `{ text, detectedScript, flags }`
- **npm:** `@alfavit/engine` (MIT) and `@alfavit/sdk`.

In the same change:
- The keyboard entry under `## Pages` becomes "How to type Ö, Ğ, Ş, Ç", on Android, iPhone, Windows and Mac.
- A line under the opening paragraph points to `${SITE_URL}/llms-full.txt` as the full text of the key pages.

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from 'vitest'
import { generateLlmsTxt } from '../seo/llms'
import { SITE_URL } from '../seo/config'

test('llms.txt names every tool with a way to reach it', () => {
  const txt = generateLlmsTxt()
  expect(txt).toContain('## Tools')
  expect(txt).toContain('POST https://api.alfavit.uz/v1/transliterate')
  expect(txt).toContain('https://t.me/alfavit_uz_bot')
  expect(txt).toContain('@alfavit/engine')
  expect(txt).toContain(`${SITE_URL}/apps`)
  expect(txt).toContain(`${SITE_URL}/llms-full.txt`)
  expect(txt).toContain('How to type Ö, Ğ, Ş, Ç')
})

test('llms.txt never links the counted download routes', () => {
  expect(generateLlmsTxt()).not.toContain('/dl/')
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @alfavit/engine build && pnpm --dir apps/web exec vitest run src/tests/llms.test.ts`
Expected: FAIL on `## Tools`.

- [ ] **Step 3: Add the section and the two line changes to `generateLlmsTxt()`.**

- [ ] **Step 4: Run the web suite**

Run: `pnpm --dir apps/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/seo/llms.ts apps/web/src/tests/llms.test.ts
git commit -m "feat(web): llms.txt names the tools and how to reach each one"
```

### Task 5: llms-full.txt (B5)

**Files:**
- Create: `apps/web/src/seo/llmsFull.ts`
- Modify: `apps/web/src/seo/sitemapPlugin.ts` (write the file next to `llms.txt`)
- Test: `apps/web/src/tests/llmsFull.test.ts` (new); `apps/web/src/tests/sitemap-build.test.ts` (dist check)

**Interfaces:**
- Consumes:
  - `LETTERS`, `SOUNDS` (`content/alphabet.ts`)
  - `STAGE`, `STATUS_COPY`, `WHEN_IN_FORCE`, `CHECKED_ON` (`content/status.ts`)
  - `timeline` (`content/timeline.ts`) and `SOURCES` (`content/sources.ts`)
  - `spotlights` (`content/reform.ts`) and `keyboard` (`content/guides/keyboard.ts`)
  - `faq` (`content/faq.ts`) and `SITE_URL`
- Produces: `generateLlmsFullTxt(): string`.

Sections, in order:
1. `# Alfavit — full text` with one line pointing back to `llms.txt`, and `Last updated: ${CHECKED_ON}`.
2. `## Legal status`: the English headline and body for `STAGE`; the "when" question and answer unless `STAGE === 'awaiting-signature'`; the English timeline as a list; and the sources, each as `label — url`.
3. `## The alphabet (28 letters)`: a Markdown table with columns Latin | Old Latin (1995) | Cyrillic | Sound | Example, using `LETTERS` in order and `SOUNDS.en`.
4. `## What changed`: the English spotlights, as `from → to`, the body, and the examples.
5. `## How to type Ö, Ğ, Ş, Ç`: `keyboard.en` intro, the numbered steps, and the note.
6. `## FAQ`, with `### English`, `### Oʻzbekcha` and `### Русский` subsections from `faq`.

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, test } from 'vitest'
import { generateLlmsFullTxt } from '../seo/llmsFull'
import { LETTERS } from '../content/alphabet'
import { STAGE, WHEN_IN_FORCE } from '../content/status'
import { keyboard } from '../content/guides/keyboard'
import { faq } from '../content/faq'

const txt = generateLlmsFullTxt()

test('carries all 28 letters in the order of the law', () => {
  const at = LETTERS.map((L) => txt.indexOf(`| ${L.latin} |`))
  expect(at.every((i) => i > 0)).toBe(true)
  expect([...at].sort((a, b) => a - b)).toEqual(at)
})

test('answers "when" once the law is signed, and cites the official text', () => {
  if (STAGE !== 'awaiting-signature') expect(txt).toContain(WHEN_IN_FORCE.en.a)
  expect(txt).toContain('https://lex.uz/uz/docs/8548754')
})

test('includes the keyboard guide and the FAQ in all three languages', () => {
  expect(txt).toContain(keyboard.en.intro)
  for (const locale of ['en', 'uz', 'ru'] as const) expect(txt).toContain(faq[locale][0].q)
})

test('stays small enough to fetch in one request', () => {
  expect(txt.length).toBeLessThan(100_000)
})
```

In `sitemap-build.test.ts`, add:

```ts
test('dist/llms-full.txt is emitted', () => {
  const full = readFileSync(resolve(__dirname, '../../dist/llms-full.txt'), 'utf-8')
  expect(full.startsWith('# Alfavit')).toBe(true)
})
```

- [ ] **Step 2: Run the unit test to verify it fails**

Run: `pnpm --dir apps/web exec vitest run src/tests/llmsFull.test.ts`
Expected: FAIL. `../seo/llmsFull` cannot be resolved.

- [ ] **Step 3: Implement `generateLlmsFullTxt()`, and write `llms-full.txt` in `sitemapPlugin.ts`** next to the existing `writeFileSync(out('llms.txt'), …)`.

- [ ] **Step 4: Run the unit and build-output suites**

Run: `pnpm --dir apps/web test && pnpm --dir apps/web test:dist`
Expected: PASS, with the dist check finding `dist/llms-full.txt`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/seo/llmsFull.ts apps/web/src/seo/sitemapPlugin.ts apps/web/src/tests/llmsFull.test.ts apps/web/src/tests/sitemap-build.test.ts
git commit -m "feat(web): llms-full.txt, the full text of the pages models quote"
```

### Task 6: Whole-repo check and the owner's review

**Files:** none new.

- [ ] **Step 1: Build the engine and run every package's tests.** API, bot, SDK, extension and desktop all consume the engine.

Run: `pnpm --filter @alfavit/engine build && pnpm test`
Expected: every turbo task passes.

- [ ] **Step 2: Check the built engine and the web build output**

Run: `pnpm --filter @alfavit/engine test:dist && pnpm --dir apps/web build && pnpm --dir apps/web test:dist`
Expected: PASS.

- [ ] **Step 3: Re-run the reviewer's cases on the built engine**

Run:

```bash
node --input-type=module -e 'import {transliterate as t} from "./packages/engine/dist/index.js"; for (const w of ["Ishoq","Mushaf","Ashob","ISHOQ","Washington","Shakespeare","www.shahar.uz","info@shahar.uz","kishi","ishonch"]) console.log(w, "->", t(w).text)'
```

Expected:

| Input | Output |
|--|--|
| Ishoq, Mushaf, Ashob, ISHOQ | unchanged |
| Washington | unchanged |
| Shakespeare | Şakespeare |
| www.shahar.uz, info@shahar.uz | unchanged |
| kishi | kişi |
| ishonch | işonç |

- [ ] **Step 4: Send the owner one review message.**
  - Include the `S_H_STEMS` table (Cyrillic, old Latin, meaning) and ask for additions or removals.
  - Include the before/after table from Step 3.
  - Ask for "merge into main and push" when it reads right.
  - Do not merge before that.
