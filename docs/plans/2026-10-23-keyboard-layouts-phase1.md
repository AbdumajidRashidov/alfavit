# Keyboard Layouts — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship macOS and Linux keyboard layouts that type ö ğ ş ç ʼ with ⌥/AltGr, generated from one key table, downloadable from a new localised page on alfavit.uz — with the Windows `.klc` checked in for Phase 1b.

**Architecture:** A new private workspace package `@alfavit/layouts` owns the five-row key table and one generator per platform; its tests run through the existing `turbo run test`. A CLI writes the artefacts into `packages/layouts/out/` and the two downloads into `apps/web/public/download/`, and CI fails if they drift. The web app imports the key table from the package, so the page cannot disagree with the files it serves.

**Tech Stack:** TypeScript 5.5 (NodeNext), vitest 2, Node 20 in CI; Swift + Carbon (`UCKeyTranslate`) for a local read-only check against Apple's US layout; libxkbcommon `xkbcli` on the Ubuntu CI runner; React + vite-react-ssg for the page; Hono for the download redirect.

**Spec:** [docs/specs/2026-10-23-keyboard-layouts-design.md](../specs/2026-10-23-keyboard-layouts-design.md)

**One deviation from the spec, in a place the spec marked as its own call:** the spec put the generator at `scripts/build-layouts.ts` and the artefacts at a top-level `layouts/`. This plan uses a workspace package (`packages/layouts/`, artefacts in `packages/layouts/out/`) so the generator's tests run in CI through the existing `turbo run test` with no new wiring, and so `apps/web` can import the key table the same way it imports `@alfavit/engine`.

## Global Constraints

- The five characters, exactly: ö U+00F6 / Ö U+00D6, ğ U+011F / Ğ U+011E, ş U+015F / Ş U+015E, ç U+00E7 / Ç U+00C7, ʼ U+02BC (no capital).
- The tutuq is always **U+02BC**. Never U+02BB, U+0027 or U+2019 in any output position of any artefact.
- Desktop placement: ⌥ (macOS) / AltGr (Linux, Windows) + base letter `o g s c '`. No other key changes, on any platform.
- macOS layout display name: `Özbek (yangi alifbo)`. Linux variant: `uz(alfavit)`, description `Uzbek (Alfavit, AltGr)`. Nothing anywhere calls the layout "official".
- Download file names: `Ozbek-yangi-alifbo.keylayout` (macOS), `alfavit-xkb.tar.gz` (Linux).
- No network access in any artefact or install step. No install scripts — every install step is a command or a click the user can read.
- No install-time claim in any copy until the owner has measured one.
- uz and ru strings ship with `// UNVERIFIED (drafted <date>): needs the owner's native-speaker check.` on the line above, the repo's convention. uz copy follows the site's current orthography (oʻ, sh, ch); the layout's name is always quoted verbatim as `Özbek (yangi alifbo)`.
- No engine changes and no npm release in this plan.
- Commits: stage explicit paths only (a second session may share the checkout), check `git status` for foreign changes first, conventional prefixes as in `git log`, and end every message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `PAGE_PATHS` dates are maintained by hand: wherever this plan says *landing date*, use the ISO date the task is committed.

## Review Focus

1. **A layout downloaded through a browser carries `com.apple.quarantine`.** A reasonable person expects it to appear in Input Sources anyway. The owner checklist (Task 7) installs from a browser-downloaded copy, never the repo copy, and the page's instructions carry the fix if it does not appear.
2. **⌘ shortcuts and Ctrl in Terminal.** ⌘C, ⌘V, ⌘S must keep working, and Ctrl+C in Terminal must still send ^C. The command keymap must be plain letters and the control keymap ASCII control codes (Task 2 tests, Task 4 compares both against Apple).
3. **Caps Lock on, then ⌥s.** A person expects Ş, not ş or ß (Task 2 test).
4. **Shift held while typing the tutuq.** ⇧⌥' must give ʼ, not Apple's Æ — Uzbek has no capital tutuq, and an Æ in Uzbek text is a bug (Task 2 test; Æ joins the displaced list).
5. **The apostrophe in every artefact is U+02BC.** One generator emitting U+02BB or U+0027 makes the layout and the converter disagree (tests in Tasks 3, 5 and 6).

---

## File Structure

```
packages/layouts/
  package.json, tsconfig.json, vitest.config.ts, README.md
  src/
    index.ts              browser-safe exports: key table, names, macDisplaced()
    keys.ts               KEY_TABLE and names
    macos/usBase.ts       hand-written US layout data (all states + dead keys)
    macos/model.ts        US base + overrides → expected output per key/state
    macos/keylayout.ts    model → .keylayout XML
    linux/upstream/uz     verbatim copy of xkeyboard-config symbols/uz (MIT)
    linux/xkb.ts          variant block, full uz symbols, evdev.xml registry
    linux/tar.ts          deterministic .tar.gz writer
    windows/klc.ts        .klc text + UTF-16LE encoder
    cli.ts                writes every artefact (node fs; not exported)
    tests/*.test.ts
  tools/compare-us.swift  local, read-only check against Apple's US layout
  out/                    generated, committed, drift-checked in CI
apps/collect/src/app.ts                      two new download targets
apps/web/src/content/keyboardLayout.ts       page copy, three locales
apps/web/src/pages/KeyboardLayoutPage.tsx    the new page
apps/web/src/content/guides/keyboard.ts      one new first step, new note
apps/web/src/components/{GuidePage,Channels,icons}.tsx
.github/workflows/ci.yml                     xkbcli install, drift check
```

---

### Task 1: The package, the key table, and its agreement with the engine

**Files:**
- Create: `packages/layouts/package.json`, `packages/layouts/tsconfig.json`, `packages/layouts/vitest.config.ts`
- Create: `packages/layouts/src/keys.ts`, `packages/layouts/src/index.ts`
- Create: `packages/layouts/src/tests/fixtures/newAlphabetWords.ts`
- Test: `packages/layouts/src/tests/keys.test.ts`

**Interfaces:**
- Produces (from `@alfavit/layouts`):
  - `type KeyBase = 'o' | 'g' | 's' | 'c' | "'"`
  - `interface KeyAssignment { base: KeyBase; lower: string; upper: string }`
  - `KEY_TABLE: readonly KeyAssignment[]` — order ö, ğ, ş, ç, ʼ; for `'`, `lower` and `upper` are both `ʼ`
  - `LAYOUT_NAME = 'Özbek (yangi alifbo)'`, `LINUX_LAYOUT = 'uz'`, `LINUX_VARIANT = 'alfavit'`, `LINUX_DESCRIPTION = 'Uzbek (Alfavit, AltGr)'`
  - `DOWNLOADS = { mac: 'Ozbek-yangi-alifbo.keylayout', linux: 'alfavit-xkb.tar.gz' } as const`

- [ ] **Step 1: Scaffold the package**

`package.json`: name `@alfavit/layouts`, `"private": true`, `"type": "module"`, `main`/`types`/`exports` pointing at `dist/` exactly as `packages/engine/package.json` does, scripts `"test": "vitest run"`, `"build": "tsc -p tsconfig.json"`, `"generate": "tsc -p tsconfig.json && node dist/cli.js"`, devDependencies `typescript ^5.5.0`, `vitest ^2.0.0`, `"@alfavit/engine": "workspace:*"`. `tsconfig.json` and `vitest.config.ts` copy the engine's (vitest includes `src/**/*.test.ts`). Run `pnpm install`.

- [ ] **Step 2: Write the failing tests**

```ts
// keys.test.ts
import { transliterate } from '@alfavit/engine'
import { KEY_TABLE } from '../index.js'
import { NEW_ALPHABET_WORDS } from './fixtures/newAlphabetWords.js'

const outputs = new Set(KEY_TABLE.flatMap((k) => [k.lower, k.upper]))

test('the table is exactly the five characters, in the reform order', () => {
  expect(KEY_TABLE.map((k) => [k.base, k.lower, k.upper])).toEqual([
    ['o', 'ö', 'Ö'], ['g', 'ğ', 'Ğ'], ['s', 'ş', 'Ş'], ['c', 'ç', 'Ç'], ["'", 'ʼ', 'ʼ'],
  ])
})

test('every new-alphabet character the engine can emit has a key, and nothing more', () => {
  const cyr = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯЎҚҒҲ'
  const input = [cyr, cyr.toLowerCase(), 'oʻ gʻ sh ch Oʻ Gʻ Sh Ch OʻZBEK SHAHAR CHOY maʻno ŏ Ŏ'].join(' ')
  const emitted = new Set([...transliterate(input).text].filter((c) => c > '\u007F' && /[\p{Script=Latin}ʼ]/u.test(c)))
  expect(emitted).toEqual(outputs)
})

test.each(NEW_ALPHABET_WORDS)('round trip: %s comes back unchanged', (word) => {
  expect(transliterate(word).text).toBe(word)
})

// Spec, "Known engine edge": the normaliser folds U+02BC into U+02BB, so o+ʼ
// becomes ö. Logged for the next engine release. When this test fails, the
// engine has been fixed — delete it and the spec section together.
test('known edge: o followed by ʼ comes back as ö', () => {
  expect(transliterate('oʼ').text).toBe('ö')
})
```

`newAlphabetWords.ts` exports `NEW_ALPHABET_WORDS: string[]` — every word in the expected (new-alphabet) strings of `packages/engine/src/tests/transliterate.test.ts`, `convert-old-latin.test.ts` and `tutuq-belgisi.test.ts`, split on whitespace and `.,!?;:()"«»` (ʼ stays inside words, so `maʼno` is one word), deduplicated, keeping only words made of ASCII letters plus `KEY_TABLE` outputs, frozen as a literal list. Must include `özbek`, `ğalaba`, `şahar`, `çoy`, `maʼno`.

- [ ] **Step 3: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/layouts`
Expected: FAIL — `KEY_TABLE` not exported.

- [ ] **Step 4: Implement `keys.ts` and `index.ts`**

`index.ts` re-exports everything in the Interfaces block. It must stay browser-safe: no `node:` imports, ever — `apps/web` bundles it.

- [ ] **Step 5: Run to see them pass**

Run: `pnpm turbo run test --filter=@alfavit/layouts`
Expected: PASS, including the known-edge test.

- [ ] **Step 6: Commit**

```bash
git add packages/layouts/package.json packages/layouts/tsconfig.json packages/layouts/vitest.config.ts packages/layouts/src pnpm-lock.yaml
git commit -m "feat(layouts): key table for ö ğ ş ç ʼ, checked against the engine"
```

---

### Task 2: The macOS model — US base plus five overrides

**Files:**
- Create: `packages/layouts/src/macos/usBase.ts`, `packages/layouts/src/macos/model.ts`
- Modify: `packages/layouts/src/index.ts` (export `macDisplaced`)
- Test: `packages/layouts/src/tests/macModel.test.ts`

**Interfaces:**
- Consumes: `KEY_TABLE`, `KeyBase` (Task 1)
- Produces:
  - `type MacState = 'plain' | 'shift' | 'caps' | 'option' | 'shiftOption' | 'capsOption' | 'command' | 'control'`
  - `type DeadKeyId = 'acute' | 'diaeresis' | 'circumflex' | 'tilde' | 'grave'`
  - `type MacOutput = string | { dead: DeadKeyId }`
  - `US_BASE: Record<number, Record<MacState, MacOutput>>` and `DEAD_KEYS: Record<DeadKeyId, { terminator: string; compose: Record<string, string> }>` in `usBase.ts`
  - `MAC_KEY_CODES: Record<KeyBase, number>` = `{ o: 31, g: 5, s: 1, c: 8, "'": 39 }`
  - `macModel(): { keys: Record<number, Record<MacState, MacOutput>>; deadKeys: typeof DEAD_KEYS; overrides: { keyCode: number; state: MacState }[] }`
  - `macDisplaced(): { combo: string; was: string; now: string }[]` (exported from `index.ts`)

`usBase.ts` is the Apple US layout written out by hand — every printable ANSI key code 0–50 plus ISO key code 10, in all eight states, and the five dead keys (⌥e acute, ⌥u diaeresis, ⌥i circumflex, ⌥n tilde, ⌥` grave) with their terminators and compositions. Task 4 proves it against Apple's own data, so transcription errors are caught there, not here. No Apple file is copied.

- [ ] **Step 1: Write the failing tests**

```ts
test('the five overrides, in every state the spec names', () => {
  const k = macModel().keys
  expect([k[31].option, k[31].shiftOption, k[31].capsOption]).toEqual(['ö', 'Ö', 'Ö'])
  expect([k[5].option, k[5].shiftOption, k[5].capsOption]).toEqual(['ğ', 'Ğ', 'Ğ'])
  expect([k[1].option, k[1].shiftOption, k[1].capsOption]).toEqual(['ş', 'Ş', 'Ş'])  // Review Focus 3
  expect([k[8].option, k[8].shiftOption, k[8].capsOption]).toEqual(['ç', 'Ç', 'Ç'])
  expect([k[39].option, k[39].shiftOption, k[39].capsOption]).toEqual(['ʼ', 'ʼ', 'ʼ']) // Review Focus 4
})

test('nothing else differs from the US base', () => {
  const { keys, overrides } = macModel()
  const overridden = new Set(overrides.map((o) => `${o.keyCode}:${o.state}`))
  for (const [code, states] of Object.entries(US_BASE))
    for (const [state, out] of Object.entries(states))
      if (!overridden.has(`${code}:${state}`)) expect(keys[+code][state as MacState]).toEqual(out)
  expect(overrides).toHaveLength(15)
})

test('⌘ gives plain letters and Ctrl gives control codes', () => {   // Review Focus 2
  const k = macModel().keys
  expect([k[8].command, k[9].command, k[1].command]).toEqual(['c', 'v', 's'])
  expect(k[8].control).toBe('\u0003')
})

test('dead keys survive: ⌥u then o is ö, ⌥e then e is é', () => {
  const { keys, deadKeys } = macModel()
  expect(keys[32].option).toEqual({ dead: 'diaeresis' })
  expect(deadKeys.diaeresis.compose.o).toBe('ö')
  expect(deadKeys.acute.compose.e).toBe('é')
})

test('ISO keyboards: key code 10 is mapped in every state', () => {
  const states = macModel().keys[10]
  for (const s of ['plain', 'shift', 'caps', 'option', 'shiftOption', 'capsOption', 'command', 'control'] as const)
    expect(states[s]).toBeDefined()
})

test('macDisplaced lists what each override replaced', () => {
  expect(macDisplaced()).toContainEqual({ combo: '⌥o', was: 'ø', now: 'ö' })
  expect(macDisplaced()).toContainEqual({ combo: '⇧⌥\'', was: 'Æ', now: 'ʼ' })
  expect(macDisplaced().find((d) => d.combo === '⌥c')).toBeUndefined() // ⌥c is already ç
})
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/layouts`
Expected: FAIL — `macModel` not defined.

- [ ] **Step 3: Implement `usBase.ts`, `model.ts`, and export `macDisplaced`**

`macModel()` deep-copies `US_BASE` and applies `KEY_TABLE` to `option` (lower), `shiftOption` and `capsOption` (upper) at `MAC_KEY_CODES`, recording each write in `overrides`. `macDisplaced()` lists the overrides where the US value differs from the new one, formatted `⌥x` / `⇧⌥x` (caps states are omitted from the list). The override count is 15: five keys × three states.

- [ ] **Step 4: Run to see them pass**

Run: `pnpm turbo run test --filter=@alfavit/layouts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/layouts/src/macos packages/layouts/src/index.ts packages/layouts/src/tests/macModel.test.ts
git commit -m "feat(layouts): macOS model — US base with the five Option overrides"
```

---

### Task 3: The `.keylayout` generator and the CLI

**Files:**
- Create: `packages/layouts/src/macos/keylayout.ts`, `packages/layouts/src/cli.ts`
- Create (generated): `packages/layouts/out/macos/Ozbek-yangi-alifbo.keylayout`, `packages/layouts/out/macos/model.json`, `apps/web/public/download/Ozbek-yangi-alifbo.keylayout`
- Test: `packages/layouts/src/tests/keylayout.test.ts`

**Interfaces:**
- Consumes: `macModel()`, `LAYOUT_NAME`, `DOWNLOADS` (Tasks 1–2)
- Produces: `generateKeylayout(): string`, `MAC_LAYOUT_ID: number`, `MAC_STATE_INDEX: Record<MacState, number>` (the `keyMap` index each state is written to) in `keylayout.ts`; `writeArtefacts(repoRoot: string): void` in `cli.ts` (later tasks add their outputs to it); `cli.ts` calls `writeArtefacts` with the repo root when run directly.

The XML shape, which nothing else determines:
- `<!DOCTYPE keyboard SYSTEM "file://localhost/System/Library/DTDs/KeyboardLayout.dtd">`, root `<keyboard group="126" id="{MAC_LAYOUT_ID}" name="Özbek (yangi alifbo)" maxout="1">`. `MAC_LAYOUT_ID` is a fixed negative integer below −1 (builder picks it once).
- One `<layout first="0" last="254" modifiers="mods" mapSet="ansi"/>` — covers every keyboard type, ISO included.
- `<modifierMap id="mods" defaultIndex="0">`, one `keyMapSelect` per `MacState`: plain `""`; command `"anyShift? caps? command"`; shift `"anyShift caps?"`; caps `"caps"`; option `"anyOption"`; shiftOption `"anyShift caps? anyOption"`; capsOption `"caps anyOption"`; control `"anyShift? caps? anyOption? anyControl"`.
- Keys whose output takes part in a dead-key composition use `action="…"`; all others use `output="…"`. Dead keys use `action` that sets `next=` the state; `<terminators>` holds each dead key's terminator. A plain `output` key pressed in a dead state emits the terminator then itself — which is how ⌥e then ⌥s gives `´ş`; no extra handling.
- Every output that is not an ASCII letter or digit is written as `&#xNNNN;`.

- [ ] **Step 1: Write the failing tests**

```ts
const xml = generateKeylayout()
const mapFor = (index: number) => xml.match(new RegExp(`<keyMap index="${index}">([\\s\\S]*?)</keyMap>`))![1]

test('names the layout and gives it a negative id', () => {
  expect(xml).toContain('name="Özbek (yangi alifbo)"')
  expect(MAC_LAYOUT_ID).toBeLessThan(-1)
})
test('the Option map carries the five letters', () => {
  const option = mapFor(MAC_STATE_INDEX.option)
  for (const [code, ch] of [[31, 'ö'], [5, 'ğ'], [1, 'ş'], [8, 'ç']] as const)
    expect(option).toContain(`<key code="${code}" output="&#x${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')};"/>`)
})
test('the tutuq is U+02BC and never U+02BB, U+0027 or U+2019', () => {   // Review Focus 5
  expect(xml).toContain('&#x02BC;')
  expect(xml).not.toMatch(/&#x02BB;|&#x2019;/)
  expect(mapFor(MAC_STATE_INDEX.option)).not.toContain('<key code="39" output="&#x0027;"/>')
})
test('ISO key code 10 appears in every keyMap', () => {
  for (const m of xml.matchAll(/<keyMap index="\d+">([\s\S]*?)<\/keyMap>/g)) expect(m[1]).toContain('<key code="10" ')
})
test.skipIf(!existsSync('/System/Library/DTDs/KeyboardLayout.dtd'))('validates against Apple\'s DTD', () => {
  // write xml to a temp file, then:
  expect(() => execFileSync('xmllint', ['--noout', '--dtdvalid', '/System/Library/DTDs/KeyboardLayout.dtd', tmp])).not.toThrow()
})
test('the committed file is what the generator produces', () => {
  expect(readFileSync(new URL('../../out/macos/Ozbek-yangi-alifbo.keylayout', import.meta.url), 'utf8')).toBe(xml)
})
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/layouts`
Expected: FAIL — `generateKeylayout` not defined.

- [ ] **Step 3: Implement `keylayout.ts` and `cli.ts`**

`writeArtefacts` writes the `.keylayout`, `out/macos/model.json` (`JSON.stringify(macModel(), null, 2)`), and copies the `.keylayout` to `apps/web/public/download/`. UTF-8, LF, trailing newline.

- [ ] **Step 4: Generate, then run the tests**

Run: `pnpm --dir packages/layouts generate && pnpm turbo run test --filter=@alfavit/layouts`
Expected: PASS, the DTD test included (it runs on macOS).

- [ ] **Step 5: Commit**

```bash
git add packages/layouts/src/macos/keylayout.ts packages/layouts/src/cli.ts packages/layouts/src/tests/keylayout.test.ts packages/layouts/out/macos apps/web/public/download/Ozbek-yangi-alifbo.keylayout
git commit -m "feat(layouts): generate the macOS .keylayout"
```

---

### Task 4: Prove the US base against Apple's own layout

**Files:**
- Create: `packages/layouts/tools/compare-us.swift`

**Interfaces:**
- Consumes: `packages/layouts/out/macos/model.json` (Task 3)
- Produces: exit status 0 and `0 mismatches`, or a list of `keyCode state expected actual` lines and exit status 1.

The non-obvious part is the Carbon calls: `TISCreateInputSourceList([kTISPropertyInputSourceID: "com.apple.keylayout.US"] as CFDictionary, true)` returns the US layout whether or not it is enabled; read `kTISPropertyUnicodeKeyLayoutData`; call `UCKeyTranslate` with `kUCKeyActionDown`, keyboard type `LMGetKbdType()`, options `0` (dead keys on), and modifier states plain 0, command 1, shift 2, caps 4, option 8, shiftOption 10, capsOption 12, control 16. For each dead key: translate the trigger (expect zero-length output and a non-zero dead state), then each `compose` base letter with that state, then space (key 49) for the terminator. Skip every `{ keyCode, state }` listed in `overrides`. This only reads layout data — it selects, enables and changes nothing.

- [ ] **Step 1: Write the tool and run it**

Run: `swift packages/layouts/tools/compare-us.swift packages/layouts/out/macos/model.json`
Expected on first run: mismatches, if any transcription in `usBase.ts` is wrong.

- [ ] **Step 2: Fix `usBase.ts` until it reports none**

Each fix goes into `usBase.ts`. Regenerate after every change (`pnpm --dir packages/layouts generate`) and rerun.
Expected: `0 mismatches`, exit 0.

- [ ] **Step 3: Run the package tests**

Run: `pnpm turbo run test --filter=@alfavit/layouts`
Expected: PASS (fixes to `usBase.ts` must not break the Task 2 tests).

- [ ] **Step 4: Commit**

```bash
git add packages/layouts/tools/compare-us.swift packages/layouts/src/macos/usBase.ts packages/layouts/out/macos apps/web/public/download/Ozbek-yangi-alifbo.keylayout
git commit -m "test(layouts): US base matches Apple's US layout key for key"
```

---

### Task 5: Linux — `uz(alfavit)`, the registry entry, and behavioural tests in CI

**Files:**
- Create: `packages/layouts/src/linux/upstream/uz`, `packages/layouts/src/linux/xkb.ts`, `packages/layouts/src/linux/tar.ts`
- Modify: `packages/layouts/src/cli.ts`, `.github/workflows/ci.yml`
- Create (generated): `packages/layouts/out/linux/xkb/symbols/uz`, `packages/layouts/out/linux/xkb/rules/evdev.xml`, `apps/web/public/download/alfavit-xkb.tar.gz`
- Test: `packages/layouts/src/tests/xkb.test.ts`, `packages/layouts/src/tests/xkbcli.test.ts`

**Interfaces:**
- Consumes: `KEY_TABLE`, `LINUX_LAYOUT`, `LINUX_VARIANT`, `LINUX_DESCRIPTION`, `DOWNLOADS` (Task 1)
- Produces: `generateAlfavitVariant(): string`, `generateUzSymbols(upstream: string): string`, `generateEvdevXml(): string` in `xkb.ts`; `tarGz(files: { path: string; content: string }[]): Buffer` in `tar.ts`

`upstream/uz` is the verbatim `symbols/uz` from xkeyboard-config at a pinned release tag, with a header comment naming the source URL, the tag and its MIT licence. It is shipped whole because a file at `~/.config/xkb/symbols/uz` shadows the system one: dropping in only the new variant would delete `uz(latin)` and `uz(cyrillic)` for the user.

The variant block, which `generateAlfavitVariant` must produce from `KEY_TABLE`:

```
partial alphanumeric_keys
xkb_symbols "alfavit" {
    include "us(basic)"
    name[Group1]= "Uzbek (Alfavit, AltGr)";
    key <AD09> { [ o, O, odiaeresis, Odiaeresis ] };
    key <AC05> { [ g, G, gbreve, Gbreve ] };
    key <AC02> { [ s, S, scedilla, Scedilla ] };
    key <AB03> { [ c, C, ccedilla, Ccedilla ] };
    key <AC11> { [ apostrophe, quotedbl, U02BC, U02BC ] };
    include "level3(ralt_switch)"
};
```

`generateEvdevXml` produces an `xkbConfigRegistry` (version 1.1) adding variant `alfavit` with description `Uzbek (Alfavit, AltGr)` under layout `uz`. The tarball holds `xkb/symbols/uz` and `xkb/rules/evdev.xml` so that `tar -xzf alfavit-xkb.tar.gz -C ~/.config` is the whole install. `tarGz` writes ustar headers with mtime 0, uid/gid 0, mode 0644, entries in that order, gzip via `node:zlib` — same input, same bytes.

- [ ] **Step 1: Write the failing tests**

```ts
// xkb.test.ts
test('the variant inherits us(basic) and uses U02BC', () => {
  const v = generateAlfavitVariant()
  expect(v).toContain('include "us(basic)"')
  expect(v).toContain('key <AC11> { [ apostrophe, quotedbl, U02BC, U02BC ] };')   // Review Focus 5
  expect(v).not.toMatch(/U02BB|rightsinglequotemark/)
})
test('the full uz file keeps every upstream variant and adds alfavit once', () => {
  const up = readFileSync(new URL('../linux/upstream/uz', import.meta.url), 'utf8')
  const out = generateUzSymbols(up)
  expect(out.startsWith(up)).toBe(true)
  expect(out.match(/xkb_symbols "alfavit"/g)).toHaveLength(1)
})
test('the tarball is byte-identical across runs', () => {
  const files = [{ path: 'xkb/symbols/uz', content: 'a' }, { path: 'xkb/rules/evdev.xml', content: 'b' }]
  expect(tarGz(files).equals(tarGz(files))).toBe(true)
})

// xkbcli.test.ts — behaviour, not syntax
const need = process.env.REQUIRE_XKBCLI === '1'
const has = spawnSync('sh', ['-c', 'command -v xkbcli']).status === 0
test.skipIf(!has && !need)('AltGr gives the five characters and uz(latin) still compiles', () => {
  // extract the generated tarball into a temp dir `cfg`, then:
  const km = execFileSync('xkbcli', ['compile-keymap', '--include', `${cfg}/xkb`, '--include-defaults', '--layout', 'uz', '--variant', 'alfavit'], { encoding: 'utf8' })
  expect(km).toMatch(/key <AC02>\s*{[^}]*scedilla,\s*Scedilla/)
  expect(km).toMatch(/key <AC11>\s*{[^}]*U02BC/)
  expect(km).toMatch(/key <AD01>\s*{[^}]*\bq,\s*Q\b/)            // an untouched key is still US
  execFileSync('xkbcli', ['compile-keymap', '--include', `${cfg}/xkb`, '--include-defaults', '--layout', 'uz', '--variant', 'latin'])
  const list = execFileSync('xkbcli', ['list', '--skip-default-paths', `${cfg}/xkb`, '/usr/share/X11/xkb'], { encoding: 'utf8' })
  expect(list).toContain('alfavit')
})
```

If `xkbcli list` does not show `alfavit` once the user registry is merged with the system one, stop and report: that is what the page tells users to rely on, and it must not be hacked around.

- [ ] **Step 2: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/layouts`
Expected: FAIL — `generateAlfavitVariant` not defined (the xkbcli test skips on macOS).

- [ ] **Step 3: Implement `xkb.ts`, `tar.ts`, extend `writeArtefacts`, fetch `upstream/uz`**

- [ ] **Step 4: Add xkbcli to CI**

In `.github/workflows/ci.yml`, before `pnpm test`: a step `sudo apt-get update && sudo apt-get install -y libxkbcommon-tools`. On the `pnpm test` step: `env: REQUIRE_XKBCLI: '1'`, so a missing tool fails instead of skipping.

- [ ] **Step 5: Generate, test locally, push, and confirm CI ran the xkbcli test**

Run: `pnpm --dir packages/layouts generate && pnpm turbo run test --filter=@alfavit/layouts`
Expected: PASS locally (xkbcli skipped); in CI, the xkbcli test listed as passed, not skipped.

- [ ] **Step 6: Commit**

```bash
git add packages/layouts/src/linux packages/layouts/src/cli.ts packages/layouts/src/tests/xkb.test.ts packages/layouts/src/tests/xkbcli.test.ts packages/layouts/out/linux apps/web/public/download/alfavit-xkb.tar.gz .github/workflows/ci.yml
git commit -m "feat(layouts): Linux uz(alfavit) drop-in, tested with xkbcli in CI"
```

---

### Task 6: Windows `.klc`, checked in for Phase 1b

**Files:**
- Create: `packages/layouts/src/windows/klc.ts`
- Modify: `packages/layouts/src/cli.ts`
- Create (generated): `packages/layouts/out/windows/ozbek-yangi-alifbo.klc`
- Test: `packages/layouts/src/tests/klc.test.ts`

**Interfaces:**
- Consumes: `KEY_TABLE`, `LAYOUT_NAME` (Task 1)
- Produces: `generateKlc(): string` (CRLF line endings), `encodeKlc(text: string): Buffer` (UTF-16LE with BOM — the encoding MSKLC reads)

Shape: `KBD alfavit "Özbek (yangi alifbo)"`, `LOCALENAME "uz-Latn-UZ"`, `LOCALEID "00000443"`, `SHIFTSTATE` 0 / 1 Shft / 2 Ctrl / 6 Ctrl Alt / 7 Shft Ctrl Alt, a `LAYOUT` row for every US key with `-1` in the AltGr columns except the five, then `KEYNAME`, `KEYNAME_EXT`, `DESCRIPTIONS`, `LANGUAGENAMES`, `ENDKBD`. No dead keys.

- [ ] **Step 1: Write the failing tests**

```ts
const klc = generateKlc()
test.each([
  ['18\tO\t\t1\to\tO\t-1\t00f6\t00d6'],
  ['22\tG\t\t1\tg\tG\t-1\t011f\t011e'],
  ['1f\tS\t\t1\ts\tS\t-1\t015f\t015e'],
  ['2e\tC\t\t1\tc\tC\t-1\t00e7\t00c7'],
  ['28\tOEM_7\t\t0\t0027\t0022\t-1\t02bc\t02bc'],   // Review Focus 5
])('carries the row %s', (row) => expect(klc).toContain(row))
test('CRLF only, and encoded UTF-16LE with a BOM', () => {
  expect(klc).not.toMatch(/[^\r]\n/)
  expect([...encodeKlc(klc).subarray(0, 2)]).toEqual([0xff, 0xfe])
})
```

The tab layout of rows above is the contract; match it exactly.

- [ ] **Step 2: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/layouts`
Expected: FAIL — `generateKlc` not defined.

- [ ] **Step 3: Implement `klc.ts`, extend `writeArtefacts`**

- [ ] **Step 4: Generate and run the tests**

Run: `pnpm --dir packages/layouts generate && pnpm turbo run test --filter=@alfavit/layouts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/layouts/src/windows packages/layouts/src/cli.ts packages/layouts/src/tests/klc.test.ts packages/layouts/out/windows
git commit -m "feat(layouts): Windows .klc source for the 1b CI build"
```

---

### Task 7: Drift check in CI, and the owner's macOS checklist

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `packages/layouts/README.md`

- [ ] **Step 1: Add the drift check**

After the `pnpm build` step in `ci.yml`: `pnpm --dir packages/layouts generate && git diff --exit-code -- packages/layouts/out apps/web/public/download`.

- [ ] **Step 2: Prove it catches drift**

Run locally: change one output in `usBase.ts` without regenerating, then `pnpm --dir packages/layouts generate && git diff --exit-code -- packages/layouts/out apps/web/public/download`.
Expected: non-zero exit. Revert the change; rerun; expected exit 0.

- [ ] **Step 3: Write `README.md`**

What the package is, `pnpm --dir packages/layouts generate`, how to run `tools/compare-us.swift`, and **Acceptance checklist — macOS (owner)** in the style of `apps/desktop/README.md`:

- [ ] Download `Ozbek-yangi-alifbo.keylayout` **through a browser** from the dev server's `/download/` path (so it carries the quarantine flag), not from the repo.
- [ ] Move it to `~/Library/Keyboard Layouts/`, log out and back in.
- [ ] System Settings → Keyboard → Input Sources → + finds `Özbek (yangi alifbo)`. If it does not appear, run `xattr -d com.apple.quarantine ~/Library/Keyboard\ Layouts/Ozbek-yangi-alifbo.keylayout`, log out and in, and note which was needed — the page's instructions follow this result.
- [ ] In TextEdit: ⌥o ⌥g ⌥s ⌥c ⌥' give `ö ğ ş ç ʼ`; with Shift, `Ö Ğ Ş Ç ʼ`; with Caps Lock on, ⌥s gives `Ş`.
- [ ] ⌥e then e gives `é`, ⌥u then u gives `ü`, ⌥n then n gives `ñ`.
- [ ] ⌘C / ⌘V work in TextEdit; Ctrl+C stops `sleep 100` in Terminal.
- [ ] Typed `maʼno` pasted into the alfavit.uz converter's input comes back unchanged (U+02BC, not U+02BB).
- [ ] With the Alfavit desktop app's live transform on, typing `özbek şahar` with the layout is left alone.
- [ ] Remove the file, log out and in: the input source is gone.
- [ ] Time from finished download to first `ş` typed: ____ (feeds the page's install-time line).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml packages/layouts/README.md
git commit -m "ci(layouts): fail when generated layouts drift; owner checklist for macOS"
```

---

### Task 8: Counted download routes

**Files:**
- Modify: `apps/collect/src/app.ts:49-52` (`INSTALLERS`)
- Test: `apps/collect/src/tests/download.test.ts`

**Interfaces:**
- Produces: `/dl/mac-layout` → `/download/Ozbek-yangi-alifbo.keylayout`, `/dl/linux-layout` → `/download/alfavit-xkb.tar.gz`, each writing one `download` point with the platform in blob10.

- [ ] **Step 1: Write the failing tests**

```ts
test.each([['mac-layout', '/download/Ozbek-yangi-alifbo.keylayout'], ['linux-layout', '/download/alfavit-xkb.tar.gz']])(
  '/dl/%s redirects to %s and counts it', async (platform, target) => {
    const { points, env } = fakeEnv()
    const res = await createApp().fetch(get(`/dl/${platform}`), env)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(target)
    expect(points[0].blobs[9]).toBe(platform)
  })
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/collect`
Expected: FAIL — 404 for the new platforms.

- [ ] **Step 3: Add the two entries to `INSTALLERS`** and update its comment ("The only two redirect targets" → four).

- [ ] **Step 4: Run to see them pass**

Run: `pnpm turbo run test --filter=@alfavit/collect`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/collect/src/app.ts apps/collect/src/tests/download.test.ts
git commit -m "feat(collect): counted downloads for the keyboard layouts"
```

---

### Task 9: The layout page, in three languages

**Files:**
- Modify: `apps/web/package.json` (add `"@alfavit/layouts": "workspace:*"`)
- Create: `apps/web/src/content/keyboardLayout.ts`, `apps/web/src/pages/KeyboardLayoutPage.tsx`
- Modify: `apps/web/src/content/types.ts`, `apps/web/src/router.tsx`, `apps/web/src/seo/config.ts`, `apps/web/src/i18n/translations.ts`, `apps/web/src/seo/llms.ts`
- Test: `apps/web/src/tests/KeyboardLayoutPage.test.tsx`, `apps/web/src/tests/llms.test.ts`

**Interfaces:**
- Consumes: `KEY_TABLE`, `LAYOUT_NAME`, `DOWNLOADS`, `macDisplaced()` from `@alfavit/layouts`; `howToLd` from `apps/web/src/seo/jsonld.ts`
- Produces: route `keyboard-layout` in all three locales; `KeyboardLayoutCopy` in `types.ts`:
  `{ title: string; intro: string; combosHeading: string; displacedHeading: string; mac: { heading: string; steps: string[]; uninstall: string }; linux: { heading: string; steps: string[]; x11Note: string }; windows: { heading: string; body: string }; privacy: string }`; translation keys `meta.keyboardLayout.title`, `meta.keyboardLayout.desc`, `guides.keyboardLayout`, `layout.download.mac`, `layout.download.linux`.

Pinned copy: `meta.keyboardLayout.title` — en `Uzbek new-alphabet keyboard layout for Mac and Linux — Alfavit`; uz `Yangi alifbo klaviaturasi: Ö, Ğ, Ş, Ç uchun Mac va Linux joylashuvi — Alfavit`; ru `Раскладка для нового узбекского алфавита: Ö, Ğ, Ş, Ç на Mac и Linux — Alfavit`. The rest is drafted under the Global Constraints: the combos table renders from `KEY_TABLE` (never retyped), the displaced list from `macDisplaced()`, the macOS steps are download → move to `~/Library/Keyboard Layouts/` → log out and in → System Settings → Keyboard → Input Sources → + → `Özbek (yangi alifbo)`; the Linux steps are download → `tar -xzf alfavit-xkb.tar.gz -C ~/.config` → log out and in → add "Uzbek (Alfavit, AltGr)"; `x11Note` says X11 sessions do not read `~/.config/xkb`; `windows.body` says the layout is coming and the Windows app converts as you type today; `privacy` says the layout is a file, not a program, and sends nothing anywhere. Download buttons are `<a href="/dl/mac-layout" download>` and `<a href="/dl/linux-layout" download>`, as on the Apps page, labelled by `layout.download.mac` / `layout.download.linux` — en `Download for macOS` / `Download for Linux`. JSON-LD: `howToLd(title, macSteps)` plus the breadcrumb.

- [ ] **Step 1: Write the failing tests**

```ts
test('renders the combos from the key table', () => {
  renderWithLocale(<KeyboardLayoutPage />, '/en')
  for (const k of KEY_TABLE) expect(screen.getAllByText(k.lower).length).toBeGreaterThan(0)
  expect(screen.getByText('Özbek (yangi alifbo)')).toBeInTheDocument()
})
test('lists every displaced character', () => {
  renderWithLocale(<KeyboardLayoutPage />, '/en')
  for (const d of macDisplaced()) expect(screen.getAllByText(d.was).length).toBeGreaterThan(0)
})
test('downloads go through the counted routes', () => {
  renderWithLocale(<KeyboardLayoutPage />, '/en')
  const hrefs = screen.getAllByRole('link', { name: /download/i }).map((a) => a.getAttribute('href'))
  expect(hrefs).toEqual(['/dl/mac-layout', '/dl/linux-layout'])
})
test('makes no install-time or "official" claim in any locale', () => {
  for (const l of LOCALES) expect(JSON.stringify(keyboardLayout[l])).not.toMatch(/minute|daqiqa|минут|official|rasmiy|официальн/i)
})
test('is routed and in the sitemap under every locale', () => {
  renderApp('/ru/keyboard-layout')
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(generateSitemapXml()).toContain('<loc>https://alfavit.uz/en/keyboard-layout</loc>')
})
// llms.test.ts
test('llms.txt points to the layout page, never to a /dl/ route', () => {
  expect(generateLlmsTxt()).toContain(`${SITE_URL}/keyboard-layout`)
})
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/web`
Expected: FAIL — page not found.

- [ ] **Step 3: Implement**

Page, content, type, router entry (`{ path: 'keyboard-layout', Component: KeyboardLayoutPage }`), `PAGE_PATHS` entry (`priority: 0.7`, all locales, `published` and `updated` = landing date), translation keys in en/uz/ru with `UNVERIFIED` markers on uz/ru, and in `llms.ts` one `## Pages` line and one `## Tools` line for `${SITE_URL}/keyboard-layout`.

- [ ] **Step 4: Run tests and the build-output assertions**

Run: `pnpm turbo run test --filter=@alfavit/web && pnpm turbo run build --filter=@alfavit/web && pnpm --dir apps/web test:dist`
Expected: PASS; `dist/keyboard-layout.html`, `dist/ru/keyboard-layout.html`, `dist/en/keyboard-layout.html` exist.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/src/content/keyboardLayout.ts apps/web/src/content/types.ts apps/web/src/pages/KeyboardLayoutPage.tsx apps/web/src/router.tsx apps/web/src/seo/config.ts apps/web/src/i18n/translations.ts apps/web/src/seo/llms.ts apps/web/src/tests/KeyboardLayoutPage.test.tsx apps/web/src/tests/llms.test.ts
git commit -m "feat(web): /keyboard-layout — download page for the macOS and Linux layouts"
```

---

### Task 10: The keyboard guide's new first step and note

**Files:**
- Modify: `apps/web/src/content/types.ts` (`Guide.steps[]` gains `link?: { pagePath: string; label: string }`)
- Modify: `apps/web/src/components/GuidePage.tsx:71-78` (render the link under the step body)
- Modify: `apps/web/src/content/guides/keyboard.ts` (one new step at index 0, new `note`, all three locales)
- Modify: `apps/web/src/seo/config.ts` (`guide/keyboard` `updated` = landing date)
- Test: `apps/web/src/tests/GuideKeyboardPage.test.tsx`

**Interfaces:**
- Consumes: route `keyboard-layout` (Task 9)
- Produces: `link` on a guide step renders `<Link to={lp('/' + link.pagePath)}>{link.label} →</Link>`; `howToLd` keeps using `heading` and `body` only.

Pinned en copy — new step: heading `Install the Alfavit keyboard layout (Mac and Linux)`; body `Hold Option on a Mac, or AltGr on Linux, and press o, g, s or c for ö, ğ, ş or ç; with the apostrophe key it types ʼ. Every other key stays where it is, nothing runs in the background, and nothing you type leaves your computer.`; link `{ pagePath: 'keyboard-layout', label: 'Get the layout' }`. New note: `A layout proposal reported in September 2026 places Ö, Ğ, Ş and Ç on punctuation keys that are unused in Uzbek; it has not been published. Until it is, Alfavit's layout adds the letters without moving a key, and Turkish Q works if you would rather not install anything. Alfavit will ship the official placement as soon as it is published.` uz and ru are translations of these, marked `UNVERIFIED`.

- [ ] **Step 1: Update the tests to the new contract**

In `GuideKeyboardPage.test.tsx`:
- the note assertion becomes `/Alfavit will ship the official placement as soon as it is published/`;
- the order test becomes `expect(steps.slice(0, 5)).toEqual(['Install the Alfavit keyboard layout (Mac and Linux)', 'Copy the letters from this page', 'iPhone and Android', 'Windows', 'Mac'])`;
- the dotless-ı `test.each` destructures `const [, , phone, windows, mac] = keyboard[locale].steps`;
- add:

```ts
test('the first step links to the layout page', () => {
  renderWithLocale(<GuideKeyboardPage />, '/en')
  expect(screen.getByRole('link', { name: /Get the layout/ })).toHaveAttribute('href', '/en/keyboard-layout')
})
test.each(LOCALES)('in %s, the new first step links to keyboard-layout', (locale) => {
  expect(keyboard[locale].steps[0].link?.pagePath).toBe('keyboard-layout')
})
```

- [ ] **Step 2: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/web -- GuideKeyboardPage`
Expected: FAIL on the order, note and link tests.

- [ ] **Step 3: Implement** the type field, the `GuidePage` link, the new step and note in en/uz/ru, and the `updated` date.

- [ ] **Step 4: Run to see them pass, and confirm no existing step changed**

Run: `pnpm turbo run test --filter=@alfavit/web && git diff -U0 apps/web/src/content/guides/keyboard.ts`
Expected: tests PASS; the diff removes only the three `note:` lines and adds only the new step objects, new `note:` lines and their markers — no removed line inside an existing step.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/content/types.ts apps/web/src/components/GuidePage.tsx apps/web/src/content/guides/keyboard.ts apps/web/src/seo/config.ts apps/web/src/tests/GuideKeyboardPage.test.tsx
git commit -m "feat(web): keyboard guide leads with the Alfavit layout; existing steps unchanged"
```

---

### Task 11: Layout cards on the Apps page

**Files:**
- Modify: `apps/web/src/components/icons.tsx` (add `KeyboardIcon`), `apps/web/src/components/Channels.tsx`, `apps/web/src/i18n/translations.ts`, `apps/web/src/seo/config.ts` (`apps` `updated` = landing date)
- Test: `apps/web/src/tests/Channels.test.tsx`

**Interfaces:**
- Consumes: route `keyboard-layout` (Task 9)
- Produces: two desktop-group items after Windows — `channels.layout.mac.name` / `.desc` and `channels.layout.linux.name` / `.desc`, `Icon: KeyboardIcon`, `live: true`, `href: '/keyboard-layout'`, `badge: 'new'`, no `download` (the cards open the page, because installing needs its instructions).

Pinned en: names `Keyboard layout — macOS`, `Keyboard layout — Linux`; desc `Type ö ğ ş ç ʼ with Option (Mac) or AltGr (Linux). No app, nothing moves, nothing sent anywhere.` (same desc for both).

- [ ] **Step 1: Update and add tests**

`expect(screen.getAllByText('New')).toHaveLength(4)`; the Open-hrefs assertions include `/en/keyboard-layout` twice; the `/converts to new-Latin/` count stays 2 (the layout desc must not match it).

- [ ] **Step 2: Run to see them fail**

Run: `pnpm turbo run test --filter=@alfavit/web -- Channels`
Expected: FAIL

- [ ] **Step 3: Implement** the icon, the two items, the translation keys (uz/ru `UNVERIFIED`) and the `updated` date.

- [ ] **Step 4: Run to see them pass**

Run: `pnpm turbo run test --filter=@alfavit/web`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/icons.tsx apps/web/src/components/Channels.tsx apps/web/src/i18n/translations.ts apps/web/src/seo/config.ts apps/web/src/tests/Channels.test.tsx
git commit -m "feat(web): keyboard layout cards on the Apps page"
```

---

### Task 12: Whole-repo verification and the owner handoff

- [ ] **Step 1: Run exactly what CI runs**

Run: `pnpm install --frozen-lockfile && pnpm test && pnpm build && pnpm --dir apps/web test:dist && pnpm --dir packages/engine test:dist && pnpm --dir packages/layouts generate && git diff --exit-code -- packages/layouts/out apps/web/public/download`
Expected: all pass; drift check exits 0.

- [ ] **Step 2: Run the Apple comparison once more**

Run: `swift packages/layouts/tools/compare-us.swift packages/layouts/out/macos/model.json`
Expected: `0 mismatches`.

- [ ] **Step 3: Hand the owner the checklist**

The owner runs the macOS checklist in `packages/layouts/README.md`, reads the uz and ru strings marked `UNVERIFIED`, and reports the install time and whether the quarantine fix was needed. Success criterion 1 is met only on the owner's word, not on the assistant's.
