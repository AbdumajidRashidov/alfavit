# Alfavit Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@alfavit/engine`, a pure TypeScript library that converts Uzbek text (Cyrillic or old 1995 Latin) into the reformed new Latin script, with per-segment ambiguity flags.

**Architecture:** A three-layer pipeline — (1) detect & normalize input into same-script runs, (2) convert each run with deterministic, case-preserving rules, (3) override with a curated exception dictionary. Genuinely uncertain spots emit ambiguity flags instead of silent guesses. No runtime dependencies; runs in browser, Node, React Native, Electron/Tauri.

**Tech Stack:** TypeScript (strict), Vitest (dev-only, test runner), Turborepo + pnpm workspaces, Node 20+.

**Monorepo layout:** Turborepo orchestrates the repo task graph. Libraries live under `packages/*` (the engine is `packages/engine`); future channels (web app, API, browser extension) live under `apps/*` and each depend on `@alfavit/engine`. This plan builds only the engine; `apps/` is established but left empty (YAGNI).

```
alfavit/
├── turbo.json              # task pipeline (build, test, lint, dev)
├── pnpm-workspace.yaml     # packages/* + apps/*
├── package.json            # root; devDependency: turbo
├── packages/
│   └── engine/             # @alfavit/engine  ← this plan
└── apps/                   # future: web, api, extension (empty for now)
```

## Global Constraints

- Package name: `@alfavit/engine`. Zero runtime dependencies (dev dependencies allowed).
- Monorepo: Turborepo + pnpm workspaces. Root scripts run through `turbo` (`turbo run build`, `turbo run test`); the tight TDD loop runs Vitest directly inside `packages/engine`.
- TypeScript `strict: true`. Target ES2022, output ESM.
- New-Latin reform letters (verify against official decree in Task 1): `ç ş ğ` and the loanword `c`; `oʻ→ŏ` is **provisional** (sources disagree ŏ vs ö — do NOT hard-code as certain until Task 1 resolves it).
- Case preservation is mandatory in every conversion: output case is driven by the case of the first source character of each mapped unit.
- Every conversion is offline and synchronous. No network, no I/O in the engine.
- Public API is the only stable surface: `transliterate`, `detectScript`, and exported types. Everything else is internal.
- TDD: write the failing test first, watch it fail, implement minimally, watch it pass, commit.

---

### Task 1: Turborepo scaffold + official-mapping grounding

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `packages/engine/package.json`
- Create: `packages/engine/tsconfig.json`
- Create: `packages/engine/vitest.config.ts`
- Create: `packages/engine/src/index.ts`
- Create: `packages/engine/src/index.test.ts`
- Create: `packages/engine/docs/official-mapping-source.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a working Turborepo + test harness; `version` string exported from `src/index.ts`.

- [ ] **Step 1: Source the official reform table (grounding)**

Before writing mapping code, fetch and record the authoritative letter set. Create `packages/engine/docs/official-mapping-source.md` with:
- The URL/citation of the adopted reform law and Cabinet orthography rules.
- A verbatim copy of the official Cyrillic↔new-Latin correspondence table.
- An explicit resolution of the `oʻ → ŏ` vs `ö` question, with the source.

If the official decree cannot be located, record that fact in the file and mark every uncertain mapping as `PROVISIONAL` in the mapping modules (Tasks 5–6). Do not block the build — the pipeline is designed so mapping values are data that can be corrected later.

- [ ] **Step 2: Create the Turborepo root + workspace manifests**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
  - "apps/*"
```

`package.json` (root):
```json
{
  "name": "alfavit",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "dev": "turbo run dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

`.gitignore`:
```
node_modules
dist
.turbo
```

`packages/engine/package.json`:
```json
{
  "name": "@alfavit/engine",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } },
  "files": ["dist"],
  "scripts": {
    "test": "vitest run",
    "build": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

`packages/engine/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["**/*.test.ts"]
}
```

`packages/engine/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
```

- [ ] **Step 3: Write the failing test**

`packages/engine/src/index.test.ts`:
```ts
import { expect, test } from 'vitest'
import { version } from './index'

test('exports a version string', () => {
  expect(typeof version).toBe('string')
})
```

`packages/engine/src/index.ts`:
```ts
// intentionally empty for now
```

- [ ] **Step 4: Install and run the test to verify it fails**

Run from the repo root: `pnpm install`
Then from `packages/engine`: `pnpm test`
Expected: FAIL — `version` is not exported.

(Throughout this plan, per-file commands like `pnpm test src/foo.test.ts` are run from `packages/engine` for the tight TDD loop. Whole-repo orchestration uses `pnpm turbo run test` / `pnpm turbo run build` from the root.)

- [ ] **Step 5: Implement minimally**

`packages/engine/src/index.ts`:
```ts
export const version = '0.0.1'
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore packages/engine
git commit -m "chore: scaffold Turborepo monorepo + @alfavit/engine package + grounding doc"
```

---

### Task 2: Core types

**Files:**
- Create: `packages/engine/src/types.ts`
- Create: `packages/engine/src/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type SourceScript = 'cyrillic' | 'old-latin' | 'foreign'`
  - `interface Segment { source: string; output: string; script: SourceScript; start: number; end: number }`
  - `interface AmbiguityFlag { start: number; end: number; chosen: string; alternatives: string[]; reason: string }`
  - `interface TransliterateResult { text: string; segments: Segment[]; flags: AmbiguityFlag[] }`
  - `interface TransliterateOptions { source?: 'auto' | 'cyrillic' | 'old-latin'; onAmbiguity?: 'first' | 'flag' }`
  - `function emptyResult(): TransliterateResult`

- [ ] **Step 1: Write the failing test**

`packages/engine/src/types.test.ts`:
```ts
import { expect, test } from 'vitest'
import { emptyResult } from './types'

test('emptyResult returns an empty, well-formed result', () => {
  const r = emptyResult()
  expect(r).toEqual({ text: '', segments: [], flags: [] })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/types.test.ts`
Expected: FAIL — cannot find module './types'.

- [ ] **Step 3: Implement**

`packages/engine/src/types.ts`:
```ts
export type SourceScript = 'cyrillic' | 'old-latin' | 'foreign'

export interface Segment {
  source: string
  output: string
  script: SourceScript
  start: number
  end: number
}

export interface AmbiguityFlag {
  start: number
  end: number
  chosen: string
  alternatives: string[]
  reason: string
}

export interface TransliterateResult {
  text: string
  segments: Segment[]
  flags: AmbiguityFlag[]
}

export interface TransliterateOptions {
  source?: 'auto' | 'cyrillic' | 'old-latin'
  onAmbiguity?: 'first' | 'flag'
}

export function emptyResult(): TransliterateResult {
  return { text: '', segments: [], flags: [] }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/types.ts packages/engine/src/types.test.ts
git commit -m "feat(engine): core result and option types"
```

---

### Task 3: Apostrophe normalization

**Files:**
- Create: `packages/engine/src/normalize.ts`
- Create: `packages/engine/src/normalize.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `function normalizeApostrophes(text: string): string` — folds all apostrophe/turned-comma variants (`' ' ' ‘ ʹ ` and ASCII `'`) used after o/g into the canonical modifier letter turned comma `ʻ` (U+02BB).

- [ ] **Step 1: Write the failing test**

`packages/engine/src/normalize.test.ts`:
```ts
import { expect, test } from 'vitest'
import { normalizeApostrophes } from './normalize'

test('folds apostrophe variants to U+02BB', () => {
  expect(normalizeApostrophes("o'g'")).toBe('oʻgʻ')
  expect(normalizeApostrophes('o’g’')).toBe('oʻgʻ')
  expect(normalizeApostrophes('oʼgʼ')).toBe('oʻgʻ')
})

test('leaves already-canonical text unchanged', () => {
  expect(normalizeApostrophes('oʻgʻ')).toBe('oʻgʻ')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/normalize.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`packages/engine/src/normalize.ts`:
```ts
const APOSTROPHE_VARIANTS = /['’‘ʼʹ`´]/g

export function normalizeApostrophes(text: string): string {
  return text.replace(APOSTROPHE_VARIANTS, 'ʻ')
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/normalize.ts packages/engine/src/normalize.test.ts
git commit -m "feat(engine): apostrophe normalization"
```

---

### Task 4: Script detection & segmentation

**Files:**
- Create: `packages/engine/src/detect.ts`
- Create: `packages/engine/src/detect.test.ts`

**Interfaces:**
- Consumes: `SourceScript` from `./types`.
- Produces:
  - `function detectScript(text: string): SourceScript` — dominant script by letter count; `'foreign'` if no Cyrillic and no Latin letters.
  - `function segment(text: string): Array<{ text: string; script: SourceScript; start: number; end: number }>` — splits input into maximal consecutive runs where each char is classified cyrillic / latin(→'old-latin') / other(→'foreign'); adjacent chars of the same class are one run. Indices refer to the original string.

- [ ] **Step 1: Write the failing test**

`packages/engine/src/detect.test.ts`:
```ts
import { expect, test } from 'vitest'
import { detectScript, segment } from './detect'

test('detectScript picks the dominant letter script', () => {
  expect(detectScript('салом')).toBe('cyrillic')
  expect(detectScript('salom')).toBe('old-latin')
  expect(detectScript('12:30 —')).toBe('foreign')
})

test('segment splits into script runs with correct indices', () => {
  const runs = segment('салом, salom')
  expect(runs).toEqual([
    { text: 'салом', script: 'cyrillic', start: 0, end: 5 },
    { text: ', ', script: 'foreign', start: 5, end: 7 },
    { text: 'salom', script: 'old-latin', start: 7, end: 12 },
  ])
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/detect.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`packages/engine/src/detect.ts`:
```ts
import type { SourceScript } from './types'

const CYRILLIC = /[Ѐ-ӿԀ-ԯ]/
const LATIN = /[A-Za-zÇçŞşĞğŎŏÖöʻ]/

function classify(ch: string): SourceScript {
  if (CYRILLIC.test(ch)) return 'cyrillic'
  if (LATIN.test(ch)) return 'old-latin'
  return 'foreign'
}

export function detectScript(text: string): SourceScript {
  let cyr = 0
  let lat = 0
  for (const ch of text) {
    const c = classify(ch)
    if (c === 'cyrillic') cyr++
    else if (c === 'old-latin') lat++
  }
  if (cyr === 0 && lat === 0) return 'foreign'
  return cyr >= lat ? 'cyrillic' : 'old-latin'
}

export function segment(text: string) {
  const runs: Array<{ text: string; script: SourceScript; start: number; end: number }> = []
  let start = 0
  while (start < text.length) {
    const script = classify(text[start])
    let end = start + 1
    while (end < text.length && classify(text[end]) === script) end++
    runs.push({ text: text.slice(start, end), script, start, end })
    start = end
  }
  return runs
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/detect.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/detect.ts packages/engine/src/detect.test.ts
git commit -m "feat(engine): script detection and run segmentation"
```

---

### Task 5: Case helper + old-Latin → new-Latin conversion

**Files:**
- Create: `packages/engine/src/case.ts`
- Create: `packages/engine/src/case.test.ts`
- Create: `packages/engine/src/mappings/old-latin.ts`
- Create: `packages/engine/src/convert-old-latin.ts`
- Create: `packages/engine/src/convert-old-latin.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `function applyCase(template: string, sourceFirstChar: string): string` — returns `template` uppercased if `sourceFirstChar` is uppercase, else as-is.
  - `const OLD_LATIN_DIGRAPHS: Array<[string, string]>` — lowercase source→target, longest-first.
  - `function convertOldLatin(text: string): string` — normalizes apostrophes, then applies digraph replacements with case preservation.

- [ ] **Step 1: Write the failing tests**

`packages/engine/src/case.test.ts`:
```ts
import { expect, test } from 'vitest'
import { applyCase } from './case'

test('applyCase matches the source lead char casing', () => {
  expect(applyCase('ş', 's')).toBe('ş')
  expect(applyCase('ş', 'S')).toBe('Ş')
})
```

`packages/engine/src/convert-old-latin.test.ts`:
```ts
import { expect, test } from 'vitest'
import { convertOldLatin } from './convert-old-latin'

test('converts 1995 digraphs to reform letters', () => {
  expect(convertOldLatin('shamol')).toBe('şamol')
  expect(convertOldLatin('choy')).toBe('çoy')
})

test('converts apostrophe letters', () => {
  expect(convertOldLatin("o'zbek")).toBe('ŏzbek')
  expect(convertOldLatin("g'alaba")).toBe('ğalaba')
})

test('preserves case', () => {
  expect(convertOldLatin('Shamol')).toBe('Şamol')
  expect(convertOldLatin("O'zbek")).toBe('Ŏzbek')
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm test src/case.test.ts src/convert-old-latin.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`packages/engine/src/case.ts`:
```ts
export function applyCase(template: string, sourceFirstChar: string): string {
  const isUpper = sourceFirstChar !== sourceFirstChar.toLowerCase()
  return isUpper ? template.toUpperCase() : template
}
```

`packages/engine/src/mappings/old-latin.ts`:
```ts
// Longest source sequences first so 'oʻ' matches before 'o'.
// NOTE: 'oʻ'→'ŏ' is PROVISIONAL pending Task 1 grounding (ŏ vs ö).
export const OLD_LATIN_DIGRAPHS: Array<[string, string]> = [
  ['oʻ', 'ŏ'],
  ['gʻ', 'ğ'],
  ['sh', 'ş'],
  ['ch', 'ç'],
]
```

`packages/engine/src/convert-old-latin.ts`:
```ts
import { normalizeApostrophes } from './normalize'
import { applyCase } from './case'
import { OLD_LATIN_DIGRAPHS } from './mappings/old-latin'

export function convertOldLatin(text: string): string {
  const src = normalizeApostrophes(text)
  let out = ''
  let i = 0
  outer: while (i < src.length) {
    const lower = src.slice(i).toLowerCase()
    for (const [from, to] of OLD_LATIN_DIGRAPHS) {
      if (lower.startsWith(from)) {
        out += applyCase(to, src[i])
        i += from.length
        continue outer
      }
    }
    out += src[i]
    i++
  }
  return out
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm test src/case.test.ts src/convert-old-latin.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/case.ts packages/engine/src/case.test.ts packages/engine/src/mappings/old-latin.ts packages/engine/src/convert-old-latin.ts packages/engine/src/convert-old-latin.test.ts
git commit -m "feat(engine): old-Latin to new-Latin conversion with case preservation"
```

---

### Task 6: Cyrillic base mapping (unambiguous letters)

**Files:**
- Create: `packages/engine/src/mappings/cyrillic.ts`
- Create: `packages/engine/src/convert-cyrillic.ts`
- Create: `packages/engine/src/convert-cyrillic.test.ts`

**Interfaces:**
- Consumes: `applyCase` from `./case`; `AmbiguityFlag` from `./types`.
- Produces:
  - `const CYRILLIC_MAP: Record<string, string>` — lowercase Cyrillic char → new-Latin (unambiguous letters only; ambiguous е/ц handled in Task 7).
  - `function convertCyrillicRun(text: string, offset: number): { output: string; flags: AmbiguityFlag[] }` — converts one Cyrillic run, preserving case; `offset` is the run's start index in the original input so flags carry absolute positions. In this task, ambiguous chars are handled by Task 7's hook (here they fall through to the base map defaults; the function signature already returns `flags: []`).

- [ ] **Step 1: Write the failing test**

`packages/engine/src/convert-cyrillic.test.ts`:
```ts
import { expect, test } from 'vitest'
import { convertCyrillicRun } from './convert-cyrillic'

test('maps unambiguous Cyrillic letters', () => {
  expect(convertCyrillicRun('салом', 0).output).toBe('salom')
  expect(convertCyrillicRun('ўзбек', 0).output).toBe('ŏzbek')
  expect(convertCyrillicRun('чой', 0).output).toBe('çoy')
  expect(convertCyrillicRun('шамол', 0).output).toBe('şamol')
})

test('maps multi-letter Cyrillic vowels', () => {
  expect(convertCyrillicRun('ёзув', 0).output).toBe('yozuv')
})

test('preserves case', () => {
  expect(convertCyrillicRun('Салом', 0).output).toBe('Salom')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/convert-cyrillic.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`packages/engine/src/mappings/cyrillic.ts`:
```ts
// PROVISIONAL — verify every row against the official decree (Task 1).
// Ambiguous letters е and ц are intentionally omitted here; see Task 7.
export const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ж: 'j', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ш: 'ş', ч: 'ç',
  ё: 'yo', ю: 'yu', я: 'ya', э: 'e',
  ў: 'ŏ', ғ: 'ğ', қ: 'q', ҳ: 'h',
  ъ: 'ʼ', ь: '',
}
```

`packages/engine/src/convert-cyrillic.ts`:
```ts
import { applyCase } from './case'
import { CYRILLIC_MAP } from './mappings/cyrillic'
import type { AmbiguityFlag } from './types'

export function convertCyrillicRun(
  text: string,
  offset: number,
): { output: string; flags: AmbiguityFlag[] } {
  const flags: AmbiguityFlag[] = []
  let output = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const lower = ch.toLowerCase()
    const mapped = CYRILLIC_MAP[lower]
    if (mapped !== undefined) {
      output += applyCase(mapped, ch)
    } else {
      output += ch // unknown char passes through
    }
  }
  return { output, flags }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/convert-cyrillic.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/mappings/cyrillic.ts packages/engine/src/convert-cyrillic.ts packages/engine/src/convert-cyrillic.test.ts
git commit -m "feat(engine): Cyrillic base mapping for unambiguous letters"
```

---

### Task 7: Cyrillic ambiguous letters + ambiguity flags

**Files:**
- Modify: `packages/engine/src/convert-cyrillic.ts`
- Modify: `packages/engine/src/convert-cyrillic.test.ts`

**Interfaces:**
- Consumes: everything from Task 6.
- Produces: `convertCyrillicRun` now resolves `е` (→ `ye` when word-initial or after a vowel/`ъ`/`ь`, else `e`) and `ц` (→ `s` by default), emitting an `AmbiguityFlag` for each with the chosen value, alternatives, and a `reason`. Absolute flag positions use `offset + i`.

- [ ] **Step 1: Add failing tests**

Append to `packages/engine/src/convert-cyrillic.test.ts`:
```ts
test('е becomes ye word-initially and flags it', () => {
  const r = convertCyrillicRun('ер', 0)
  expect(r.output).toBe('yer')
  expect(r.flags[0]).toMatchObject({
    start: 0, end: 1, chosen: 'ye', alternatives: ['e'], reason: 'cyrillic-e-position',
  })
})

test('е becomes e after a consonant', () => {
  expect(convertCyrillicRun('мен', 0).output).toBe('men')
})

test('ц defaults to s and flags the alternative c', () => {
  const r = convertCyrillicRun('цех', 0)
  expect(r.output).toBe('sex')
  expect(r.flags[0]).toMatchObject({
    chosen: 's', alternatives: ['c'], reason: 'cyrillic-ts',
  })
})

test('flag positions are absolute with offset', () => {
  const r = convertCyrillicRun('ер', 7)
  expect(r.flags[0]).toMatchObject({ start: 7, end: 8 })
})
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `pnpm test src/convert-cyrillic.test.ts`
Expected: FAIL — `е` currently passes through unmapped; `ц` unmapped.

- [ ] **Step 3: Implement the ambiguity logic**

Replace the body of `convertCyrillicRun` in `packages/engine/src/convert-cyrillic.ts`:
```ts
import { applyCase } from './case'
import { CYRILLIC_MAP } from './mappings/cyrillic'
import type { AmbiguityFlag } from './types'

const CYRILLIC_VOWELS = new Set([...'аеёиоуўэюяАЕЁИОУЎЭЮЯ'])

export function convertCyrillicRun(
  text: string,
  offset: number,
): { output: string; flags: AmbiguityFlag[] } {
  const flags: AmbiguityFlag[] = []
  let output = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const lower = ch.toLowerCase()
    const prev = i > 0 ? text[i - 1] : ''
    const wordInitial = i === 0 || (!CYRILLIC_VOWELS.has(prev) && !/[а-яё]/i.test(prev))

    if (lower === 'е') {
      const afterVowelOrSign = CYRILLIC_VOWELS.has(prev) || prev === 'ъ' || prev === 'ь'
      const useYe = wordInitial || afterVowelOrSign
      const chosen = useYe ? 'ye' : 'e'
      output += applyCase(chosen, ch)
      flags.push({
        start: offset + i, end: offset + i + 1,
        chosen, alternatives: [useYe ? 'e' : 'ye'], reason: 'cyrillic-e-position',
      })
      continue
    }

    if (lower === 'ц') {
      const chosen = 's'
      output += applyCase(chosen, ch)
      flags.push({
        start: offset + i, end: offset + i + 1,
        chosen, alternatives: ['c'], reason: 'cyrillic-ts',
      })
      continue
    }

    const mapped = CYRILLIC_MAP[lower]
    output += mapped !== undefined ? applyCase(mapped, ch) : ch
  }
  return { output, flags }
}
```

- [ ] **Step 4: Run to verify all Cyrillic tests pass**

Run: `pnpm test src/convert-cyrillic.test.ts`
Expected: PASS (Task 6 tests still pass; new tests pass).

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/convert-cyrillic.ts packages/engine/src/convert-cyrillic.test.ts
git commit -m "feat(engine): resolve ambiguous Cyrillic е/ц with ambiguity flags"
```

---

### Task 8: Exception dictionary

**Files:**
- Create: `packages/engine/src/dictionary.ts`
- Create: `packages/engine/src/dictionary.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `const EXCEPTIONS: Record<string, string>` — lowercase source word → exact new-Latin output (proper nouns / loanwords that break rules). Data-only; extended without code changes.
  - `function lookupException(word: string): string | undefined` — case-insensitive lookup that reapplies the input word's leading capitalization to the result.

- [ ] **Step 1: Write the failing test**

`packages/engine/src/dictionary.test.ts`:
```ts
import { expect, test } from 'vitest'
import { lookupException } from './dictionary'

test('returns override for a known exception, preserving lead case', () => {
  // 'цирк' would rule-convert to 'sirk'; dictionary forces 'sirk' explicitly as a demo entry
  expect(lookupException('цирк')).toBe('sirk')
  expect(lookupException('Цирк')).toBe('Sirk')
})

test('returns undefined for unknown words', () => {
  expect(lookupException('салом')).toBeUndefined()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/dictionary.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`packages/engine/src/dictionary.ts`:
```ts
// Curated overrides. Keys are lowercase source words (Cyrillic or old-Latin).
// Extend this table over time; no code change needed.
export const EXCEPTIONS: Record<string, string> = {
  цирк: 'sirk',
}

export function lookupException(word: string): string | undefined {
  const hit = EXCEPTIONS[word.toLowerCase()]
  if (hit === undefined) return undefined
  const isUpper = word[0] !== word[0].toLowerCase()
  return isUpper ? hit[0].toUpperCase() + hit.slice(1) : hit
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/dictionary.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/dictionary.ts packages/engine/src/dictionary.test.ts
git commit -m "feat(engine): exception dictionary with case-aware lookup"
```

---

### Task 9: Orchestration — `transliterate()`

**Files:**
- Create: `packages/engine/src/transliterate.ts`
- Create: `packages/engine/src/transliterate.test.ts`

**Interfaces:**
- Consumes: `segment` (Task 4), `convertOldLatin` (Task 5), `convertCyrillicRun` (Task 6/7), `lookupException` (Task 8), types (Task 2).
- Produces: `function transliterate(input: string, options?: TransliterateOptions): TransliterateResult` — segments input; per run: `foreign` passes through, `old-latin` uses `convertOldLatin`, `cyrillic` uses `convertCyrillicRun`; applies dictionary overrides per whitespace-delimited word before rule conversion; assembles `text`, `segments` (aligned), and `flags`. When `onAmbiguity: 'first'`, flags are still returned but `chosen` is kept (callers may ignore flags).

- [ ] **Step 1: Write the failing tests**

`packages/engine/src/transliterate.test.ts`:
```ts
import { expect, test } from 'vitest'
import { transliterate } from './transliterate'

test('converts a mixed-script sentence and preserves foreign runs', () => {
  const r = transliterate('салом, dunyo 2026')
  expect(r.text).toBe('salom, dunyo 2026')
})

test('converts old-Latin input', () => {
  expect(transliterate("o'zbek tili").text).toBe('ŏzbek tili')
})

test('collects ambiguity flags from Cyrillic runs', () => {
  const r = transliterate('ер')
  expect(r.flags).toHaveLength(1)
  expect(r.flags[0].reason).toBe('cyrillic-e-position')
})

test('segments carry source, output, and script', () => {
  const r = transliterate('чой')
  expect(r.segments).toEqual([
    { source: 'чой', output: 'çoy', script: 'cyrillic', start: 0, end: 3 },
  ])
})

test('empty input yields an empty result', () => {
  expect(transliterate('')).toEqual({ text: '', segments: [], flags: [] })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/transliterate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`packages/engine/src/transliterate.ts`:
```ts
import { segment } from './detect'
import { convertOldLatin } from './convert-old-latin'
import { convertCyrillicRun } from './convert-cyrillic'
import { lookupException } from './dictionary'
import type { Segment, TransliterateOptions, TransliterateResult } from './types'
import { emptyResult } from './types'

export function transliterate(
  input: string,
  _options: TransliterateOptions = {},
): TransliterateResult {
  if (input.length === 0) return emptyResult()

  const segments: Segment[] = []
  const flags = []

  for (const run of segment(input)) {
    if (run.script === 'foreign') {
      segments.push({ ...run, source: run.text, output: run.text })
      continue
    }

    const exception = lookupException(run.text)
    if (exception !== undefined) {
      segments.push({ source: run.text, output: exception, script: run.script, start: run.start, end: run.end })
      continue
    }

    if (run.script === 'old-latin') {
      const output = convertOldLatin(run.text)
      segments.push({ source: run.text, output, script: run.script, start: run.start, end: run.end })
    } else {
      const { output, flags: runFlags } = convertCyrillicRun(run.text, run.start)
      flags.push(...runFlags)
      segments.push({ source: run.text, output, script: run.script, start: run.start, end: run.end })
    }
  }

  return { text: segments.map((s) => s.output).join(''), segments, flags }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/transliterate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/transliterate.ts packages/engine/src/transliterate.test.ts
git commit -m "feat(engine): orchestrate detection, conversion, dictionary into transliterate()"
```

---

### Task 10: Public API + golden corpus + build

**Files:**
- Modify: `packages/engine/src/index.ts`
- Create: `packages/engine/src/golden.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: public exports — `transliterate`, `detectScript`, `version`, and all types from `./types`. This is the only stable surface.

- [ ] **Step 1: Write the failing golden-corpus test**

`packages/engine/src/golden.test.ts`:
```ts
import { expect, test } from 'vitest'
import { transliterate } from './index'

// Verified input↔output pairs. Extend as the exception dictionary grows.
const CORPUS: Array<[string, string]> = [
  ['салом дунё', 'salom dunyo'],
  ["o'zbekiston", 'ŏzbekiston'],
  ['shahar', 'şahar'],
  ['Тошкент', 'Toşkent'],
  ['12:30 — vaqt', '12:30 — vaqt'],
]

test.each(CORPUS)('golden: %s → %s', (input, expected) => {
  expect(transliterate(input).text).toBe(expected)
})

test('idempotent on already-new-Latin text', () => {
  const once = transliterate('ŏzbekiston').text
  expect(transliterate(once).text).toBe(once)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test src/golden.test.ts`
Expected: FAIL — `transliterate` / `detectScript` not exported from `./index`.

- [ ] **Step 3: Implement the public API**

`packages/engine/src/index.ts`:
```ts
export const version = '0.0.1'
export { transliterate } from './transliterate'
export { detectScript } from './detect'
export type {
  SourceScript,
  Segment,
  AmbiguityFlag,
  TransliterateResult,
  TransliterateOptions,
} from './types'
```

- [ ] **Step 4: Run the full suite + build**

Run from `packages/engine`: `pnpm test`
Then from the repo root: `pnpm turbo run build`
Expected: All tests PASS; Turborepo builds `@alfavit/engine`, producing `packages/engine/dist/index.js` and `dist/index.d.ts`.

If any golden pair fails, fix the mapping data (not the test) unless the test encodes a mistaken expectation — then correct the expectation and note why in the commit.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/index.ts packages/engine/src/golden.test.ts
git commit -m "feat(engine): public API surface + golden corpus + build"
```

---

## Self-Review Notes

- **Spec coverage:** 3-layer pipeline (Tasks 3–4 detect/normalize, 5–7 rules, 8 dictionary), ambiguity flags (Task 7), auto script detection (Task 4), API shape (Tasks 2/9/10), TDD golden corpus + idempotency (Task 10), official grounding as first task (Task 1). Reverse direction and .docx parsing correctly excluded (spec non-goals).
- **Provisional data:** `oʻ→ŏ` and the full Cyrillic table are flagged PROVISIONAL and gated on Task 1; the pipeline treats mappings as replaceable data so corrections need no structural change.
- **Type consistency:** `convertCyrillicRun(text, offset) → {output, flags}`, `convertOldLatin(text) → string`, `segment(text) → runs[]`, `Segment`/`AmbiguityFlag`/`TransliterateResult` are used identically across Tasks 2–10.
