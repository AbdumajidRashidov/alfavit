# Alfavit File Conversion — Design (Sub-project 4a, first Pro slice)

**Date:** 2026-07-11
**Status:** Approved (design)
**Location:** `apps/web` (client-side feature; reuses `@alfavit/engine`)

## 1. Context & scope

The "Pro tier" decomposes into 4 independent slices: **4a file/bulk conversion**,
4b accounts, 4c billing, 4d gating. This spec covers **4a only** — the highest-value,
self-contained piece, built **entirely client-side** so it preserves the platform's
"nothing uploaded" privacy story and needs no backend, accounts, or payments.

Users can upload a `.txt`, `.srt`, or `.docx` file and download a converted copy in the
reformed new Latin script. It ships **free/unlocked**; gating is deferred to the billing
slice.

## 2. Key simplification

The engine passes through any run that isn't a Cyrillic/old-Latin letter. So `.srt`
needs no format-specific parsing: timecodes (`00:00:01,000 --> 00:00:04,000`), indices,
and `-->` contain no letters and survive `transliterate` unchanged, while subtitle text
converts. Therefore **`.txt` and `.srt` share one code path**: `transliterate(content).text`.
Only `.docx` (a binary zip) needs special handling.

## 3. Architecture

```
apps/web/src/files/
├── convert.ts   # PURE (unit-tested):
│                #   convertPlainText(text: string): string            — .txt/.srt
│                #   transliterateDocxXml(xml: string): string          — one word/*.xml part
├── docx.ts      # convertDocx(bytes: Uint8Array): Promise<Uint8Array>  — JSZip glue (lazy)
└── index.ts     # convertFile(file: File): Promise<{ blob: Blob; filename: string }>
```

- **`convertPlainText(text)`** = `transliterate(text).text`. Used for `.txt` and `.srt`.
- **`transliterateDocxXml(xml)`** — pure string transform: for each `<w:t …>TEXT</w:t>`
  run, XML-unescape `TEXT`, `transliterate` it, re-escape, splice back. Preserves all
  tags, attributes (incl. `xml:space="preserve"`), and non-text XML. Regex is non-greedy
  per run; empty `<w:t/>` self-closing tags are left as-is.
- **`convertDocx(bytes)`** — unzip with **JSZip** (dynamically `import()`ed so it is only
  loaded when a `.docx` is actually converted), run `transliterateDocxXml` over
  `word/document.xml` and any `word/header*.xml` / `word/footer*.xml`, re-zip, return bytes.
  All other zip entries (styles, media, rels) are copied unchanged.
- **`convertFile(file)`** — dispatch by lowercased extension:
  - `.txt` / `.srt` → read text → `convertPlainText` → `Blob([...], {type})`.
  - `.docx` → read `arrayBuffer` → `convertDocx` → `Blob([...], docx mime)`.
  - anything else → throw `UnsupportedFormatError`.
  - Output filename: original base + ` (yangi lotin)` + original extension
    (e.g. `hujjat.docx` → `hujjat (yangi lotin).docx`).

## 4. UI

A new **`<FileConverter />`** section rendered after the text `<Converter />` in `App`
(the existing text converter is untouched). Behavior:

- A drop-zone + a file `<input type="file" accept=".txt,.srt,.docx">`.
- On file selected: show the filename and detected format; enable a **Convert** button.
- On Convert: run `convertFile`, then trigger a download (Blob URL + a temporary
  `<a download>`), and show a success line. Revoke the object URL after.
- Unsupported extension or a conversion error → a friendly localized message.
- Localized (uz/ru/en): section title, instructions, button, states, errors.
- Free/unlocked (no gating this slice). Honors `prefers-reduced-motion` for any reveal.

## 5. Dependencies

- **JSZip** (`apps/web`), imported dynamically only in `docx.ts` — keeps it out of the
  initial bundle; `.txt`/`.srt` conversions load nothing extra.
- No new runtime dependency for the plain-text path.

## 6. Testing (Vitest)

Pure functions (no DOM, no real files):
- `convertPlainText`: Cyrillic text → new Latin; an `.srt` sample → timecodes/indices
  unchanged, subtitle text converted; old-Latin input converts.
- `transliterateDocxXml`: `<w:t>Салом</w:t>` → `<w:t>Salom</w:t>`; attributes preserved
  (`<w:t xml:space="preserve"> чой </w:t>` → ` çoy ` with spaces kept); XML entities
  (`&amp;`, `&lt;`) round-trip correctly; non-`<w:t>` markup untouched; self-closing
  `<w:t/>` left as-is.
- `convertFile` extension dispatch: unsupported extension throws `UnsupportedFormatError`;
  filename transform is correct.

The JSZip round-trip (`convertDocx`) and the DOM download are thin glue — covered by a
light smoke test and manual verification in the browser preview, not exhaustive unit tests
(binary `.docx` fixtures are impractical to hand-author).

## 7. Out of scope

Accounts, payments, gating, history, server-side/batch conversion (all later Pro slices);
formats beyond `.txt`/`.srt`/`.docx` (e.g. `.pdf`, `.xlsx`); cross-run context at `.docx`
`<w:t>` boundaries (a word split across two runs converts each part independently — rare,
documented limitation).
