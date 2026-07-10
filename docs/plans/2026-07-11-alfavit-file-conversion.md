# Alfavit File Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client-side file conversion (`.txt` / `.srt` / `.docx`) to `apps/web` — upload a file, convert its Uzbek text to the new Latin script, download the result, all in-browser (nothing uploaded).

**Architecture:** A mostly-pure `src/files/` layer reusing `@alfavit/engine`: `.txt`/`.srt` are `transliterate(content)`; `.docx` is unzipped in-browser (JSZip, dynamically imported), its `<w:t>` text runs transliterated (formatting preserved), and re-zipped. A `<FileConverter />` section renders after the text converter. Free/unlocked (gating deferred to a later Pro slice).

**Tech Stack:** TypeScript, React, Vite, `@alfavit/engine`, JSZip (dynamic import), Vitest + React Testing Library.

## Global Constraints

- Client-side only; the file is read, converted, and downloaded in the browser — nothing uploaded.
- Reuse `@alfavit/engine` `transliterate`. `.txt` and `.srt` share the path `transliterate(content).text` (non-letters pass through, so `.srt` timecodes/indices are preserved).
- `.docx`: transliterate only text inside `<w:t>…</w:t>` runs in `word/document.xml`, `word/header*.xml`, `word/footer*.xml`; copy all other zip entries unchanged; preserve tags/attributes/XML-escaping and `xml:space="preserve"`.
- JSZip is imported dynamically (only loaded when a `.docx` is converted).
- Output filename: original base + ` (yangi lotin)` + original extension.
- Localized uz/ru/en; free/unlocked (no gating this slice). Tests in `apps/web/src/tests/`.
- TDD: failing test first → fail → minimal impl → pass → commit.

---

### Task 1: Pure conversion functions

**Files:**
- Create: `apps/web/src/files/convert.ts`
- Create: `apps/web/src/tests/convert.test.ts`

**Interfaces:**
- Consumes: `transliterate` from `@alfavit/engine`.
- Produces:
  - `convertPlainText(text: string): string` — `transliterate(text).text` (used for `.txt`/`.srt`).
  - `transliterateDocxXml(xml: string): string` — for each `<w:t …>TEXT</w:t>`, XML-unescape TEXT, transliterate, re-escape; all other XML untouched; self-closing `<w:t/>` untouched.

- [ ] **Step 1: Write the failing test**

`apps/web/src/tests/convert.test.ts`:
```ts
import { expect, test } from 'vitest'
import { convertPlainText, transliterateDocxXml } from '../files/convert'

test('convertPlainText converts Cyrillic and old-Latin', () => {
  expect(convertPlainText('салом дунё')).toBe('salom dunyo')
  expect(convertPlainText("o'zbek")).toBe('ŏzbek')
})

test('convertPlainText preserves .srt timecodes and indices', () => {
  const srt = '1\n00:00:01,000 --> 00:00:04,000\nСалом дунё\n'
  expect(convertPlainText(srt)).toBe('1\n00:00:01,000 --> 00:00:04,000\nSalom dunyo\n')
})

test('transliterateDocxXml converts w:t text, preserves tags and attrs', () => {
  expect(transliterateDocxXml('<w:t>Салом</w:t>')).toBe('<w:t>Salom</w:t>')
  expect(transliterateDocxXml('<w:t xml:space="preserve"> чой </w:t>'))
    .toBe('<w:t xml:space="preserve"> çoy </w:t>')
})

test('transliterateDocxXml round-trips XML entities', () => {
  expect(transliterateDocxXml('<w:t>А &amp; Б</w:t>')).toBe('<w:t>A &amp; B</w:t>')
})

test('transliterateDocxXml leaves non-w:t markup and empty runs untouched', () => {
  expect(transliterateDocxXml('<w:p><w:pPr/></w:p>')).toBe('<w:p><w:pPr/></w:p>')
  expect(transliterateDocxXml('<w:t/>')).toBe('<w:t/>')
})
```

- [ ] **Step 2: Run to verify it fails**

Run from `apps/web`: `pnpm test src/tests/convert.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/web/src/files/convert.ts`:
```ts
import { transliterate } from '@alfavit/engine'

export function convertPlainText(text: string): string {
  return transliterate(text).text
}

const WT_RE = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g

function xmlUnescape(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&') // must be last
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;') // must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function transliterateDocxXml(xml: string): string {
  return xml.replace(WT_RE, (_m, open: string, inner: string, close: string) => {
    const converted = transliterate(xmlUnescape(inner)).text
    return open + xmlEscape(converted) + close
  })
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test src/tests/convert.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/files/convert.ts apps/web/src/tests/convert.test.ts
git commit -m "feat(web): pure file-conversion functions (.txt/.srt + docx xml)"
```

---

### Task 2: docx round-trip + file dispatch

**Files:**
- Modify: `apps/web/package.json` (add `jszip` dependency)
- Create: `apps/web/src/files/docx.ts`
- Create: `apps/web/src/files/index.ts`
- Create: `apps/web/src/tests/files.test.ts`

**Interfaces:**
- Consumes: `convertPlainText`, `transliterateDocxXml` (`./convert`); `JSZip` (dynamic import).
- Produces:
  - `convertDocx(bytes: Uint8Array): Promise<Uint8Array>` — unzip, transliterate `word/document.xml` + `word/header*.xml` + `word/footer*.xml`, re-zip.
  - `class UnsupportedFormatError extends Error`
  - `outputFilename(name: string): string` — base + ` (yangi lotin)` + ext.
  - `convertFile(file: File): Promise<{ blob: Blob; filename: string }>` — dispatch by extension.

- [ ] **Step 1: Add the dependency**

Edit `apps/web/package.json` — add to `dependencies`:
```json
    "jszip": "^3.10.1"
```
Then from the repo root: `pnpm install`

- [ ] **Step 2: Write the failing test**

`apps/web/src/tests/files.test.ts`:
```ts
import { expect, test } from 'vitest'
import JSZip from 'jszip'
import { convertDocx } from '../files/docx'
import { convertFile, outputFilename, UnsupportedFormatError } from '../files/index'

test('outputFilename inserts the suffix before the extension', () => {
  expect(outputFilename('hujjat.docx')).toBe('hujjat (yangi lotin).docx')
  expect(outputFilename('notes')).toBe('notes (yangi lotin)')
})

test('convertDocx transliterates document.xml text, preserves the zip', async () => {
  const zip = new JSZip()
  zip.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Салом дунё</w:t></w:r></w:p></w:body></w:document>')
  zip.file('word/styles.xml', '<styles/>') // untouched entry
  const bytes = await zip.generateAsync({ type: 'uint8array' })

  const out = await convertDocx(bytes)
  const rt = await JSZip.loadAsync(out)
  expect(await rt.file('word/document.xml')!.async('string')).toContain('Salom dunyo')
  expect(await rt.file('word/styles.xml')!.async('string')).toBe('<styles/>')
})

test('convertFile converts a .txt File and names the download', async () => {
  const file = new File(['салом'], 'note.txt', { type: 'text/plain' })
  const { blob, filename } = await convertFile(file)
  expect(await blob.text()).toBe('salom')
  expect(filename).toBe('note (yangi lotin).txt')
})

test('convertFile rejects unsupported types', async () => {
  const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
  await expect(convertFile(file)).rejects.toBeInstanceOf(UnsupportedFormatError)
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test src/tests/files.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement docx.ts**

`apps/web/src/files/docx.ts`:
```ts
import { transliterateDocxXml } from './convert'

const XML_PART = /^word\/(document|header\d*|footer\d*)\.xml$/

export async function convertDocx(bytes: Uint8Array): Promise<Uint8Array> {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(bytes)
  const parts = Object.keys(zip.files).filter((p) => XML_PART.test(p))
  for (const path of parts) {
    const xml = await zip.file(path)!.async('string')
    zip.file(path, transliterateDocxXml(xml))
  }
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}
```

- [ ] **Step 5: Implement index.ts**

`apps/web/src/files/index.ts`:
```ts
import { convertPlainText } from './convert'
import { convertDocx } from './docx'

export class UnsupportedFormatError extends Error {
  constructor(what: string) {
    super(`Unsupported format: ${what}`)
    this.name = 'UnsupportedFormatError'
  }
}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function outputFilename(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  return `${base} (yangi lotin)${ext}`
}

export async function convertFile(file: File): Promise<{ blob: Blob; filename: string }> {
  const lower = file.name.toLowerCase()
  const filename = outputFilename(file.name)

  if (lower.endsWith('.txt') || lower.endsWith('.srt')) {
    const type = lower.endsWith('.srt') ? 'application/x-subrip' : 'text/plain'
    return { blob: new Blob([convertPlainText(await file.text())], { type }), filename }
  }
  if (lower.endsWith('.docx')) {
    const out = await convertDocx(new Uint8Array(await file.arrayBuffer()))
    return { blob: new Blob([out], { type: DOCX_MIME }), filename }
  }
  const dot = lower.lastIndexOf('.')
  throw new UnsupportedFormatError(dot >= 0 ? lower.slice(dot) : file.name)
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm test src/tests/files.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/src/files/docx.ts apps/web/src/files/index.ts apps/web/src/tests/files.test.ts
git commit -m "feat(web): docx round-trip conversion + file dispatch"
```

---

### Task 3: FileConverter UI + i18n + wire into the page

**Files:**
- Modify: `apps/web/src/i18n/translations.ts` (add file.* keys to uz/ru/en)
- Create: `apps/web/src/components/FileConverter.tsx`
- Modify: `apps/web/src/App.tsx` (render `<FileConverter />` after `<Converter />`)
- Create: `apps/web/src/tests/FileConverter.test.tsx`

**Interfaces:**
- Consumes: `convertFile`, `UnsupportedFormatError` (`../files`); `useT` (`../i18n/useT`).
- Produces: `<FileConverter />` — a `section#files` with a file input, a Convert button, and status/error text; triggers a browser download of the converted file.

- [ ] **Step 1: Add i18n keys**

In `apps/web/src/i18n/translations.ts`, add these keys inside EACH locale object (place after the `channels.*` block, before `footer.reform`):

en:
```ts
    'file.title': 'Convert a file',
    'file.instruction': 'Your file is converted in your browser — nothing is uploaded.',
    'file.choose': 'Choose a file (.txt, .srt, .docx)',
    'file.convert': 'Convert & download',
    'file.converting': 'Converting…',
    'file.done': 'Done — your download should start.',
    'file.unsupported': 'Unsupported file type. Use .txt, .srt, or .docx.',
```
uz:
```ts
    'file.title': 'Faylni oʻgirish',
    'file.instruction': 'Fayl brauzeringizda oʻgiriladi — hech narsa yuklanmaydi.',
    'file.choose': 'Fayl tanlang (.txt, .srt, .docx)',
    'file.convert': 'Oʻgirish va yuklab olish',
    'file.converting': 'Oʻgirilmoqda…',
    'file.done': 'Tayyor — yuklab olish boshlanadi.',
    'file.unsupported': 'Qoʻllab-quvvatlanmaydigan fayl turi. .txt, .srt yoki .docx ishlating.',
```
ru:
```ts
    'file.title': 'Конвертировать файл',
    'file.instruction': 'Файл конвертируется в браузере — ничего не загружается.',
    'file.choose': 'Выберите файл (.txt, .srt, .docx)',
    'file.convert': 'Конвертировать и скачать',
    'file.converting': 'Конвертация…',
    'file.done': 'Готово — загрузка начнётся.',
    'file.unsupported': 'Неподдерживаемый тип файла. Используйте .txt, .srt или .docx.',
```

- [ ] **Step 2: Write the failing test**

`apps/web/src/tests/FileConverter.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi, beforeEach } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { FileConverter } from '../components/FileConverter'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
  // jsdom has no object-URL / real downloads
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

function renderFC() {
  return render(<LanguageProvider><FileConverter /></LanguageProvider>)
}

test('converts a supported .txt file and reports done', async () => {
  const user = userEvent.setup()
  renderFC()
  const file = new File(['салом'], 'note.txt', { type: 'text/plain' })
  await user.upload(screen.getByTestId('file-input'), file)
  await user.click(screen.getByRole('button', { name: /Convert/i }))
  expect(await screen.findByText(/Done/i)).toBeInTheDocument()
  expect(URL.createObjectURL).toHaveBeenCalled()
})

test('shows a message for unsupported files', async () => {
  const user = userEvent.setup()
  renderFC()
  const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
  await user.upload(screen.getByTestId('file-input'), file)
  await user.click(screen.getByRole('button', { name: /Convert/i }))
  expect(await screen.findByText(/Unsupported/i)).toBeInTheDocument()
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test src/tests/FileConverter.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement FileConverter.tsx**

`apps/web/src/components/FileConverter.tsx`:
```tsx
import { useState } from 'react'
import { convertFile, UnsupportedFormatError } from '../files'
import { useT } from '../i18n/useT'

type Status = 'idle' | 'busy' | 'done' | 'error'

export function FileConverter() {
  const { t } = useT()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const onConvert = async () => {
    if (!file) return
    setStatus('busy')
    setError('')
    try {
      const { blob, filename } = await convertFile(file)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus('done')
    } catch (e) {
      setStatus('error')
      setError(e instanceof UnsupportedFormatError ? t('file.unsupported') : String(e))
    }
  }

  return (
    <section id="files" className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="font-serif text-3xl sm:text-5xl text-foreground">{t('file.title')}</h2>
      <p className="mt-3 text-sm text-muted">{t('file.instruction')}</p>

      <label className="mt-8 block cursor-pointer rounded-2xl border border-dashed border-black/20 p-8 text-center text-muted hover:border-black/40">
        <input
          data-testid="file-input"
          type="file"
          accept=".txt,.srt,.docx"
          className="sr-only"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setStatus('idle'); setError('') }}
        />
        {file ? file.name : t('file.choose')}
      </label>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onConvert}
          disabled={!file || status === 'busy'}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-transform hover:scale-[1.03] disabled:opacity-40"
        >
          {status === 'busy' ? t('file.converting') : t('file.convert')}
        </button>
        {status === 'done' && <span className="text-sm text-muted">{t('file.done')}</span>}
        {status === 'error' && <span className="text-sm text-foreground">{error}</span>}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Wire into App**

In `apps/web/src/App.tsx`, add the import and render it after `<Converter />`:
```tsx
import { FileConverter } from './components/FileConverter'
```
```tsx
        <Converter />
        <FileConverter />
        <Channels />
```

- [ ] **Step 6: Run the file + full suite**

Run: `pnpm test src/tests/FileConverter.test.tsx`
Expected: PASS (2 tests).
Then: `pnpm test`
Expected: all web tests pass (existing + convert + files + FileConverter).

- [ ] **Step 7: Build**

Run from repo root: `pnpm turbo run build --filter=@alfavit/web`
Expected: succeeds. (JSZip is dynamically imported, so it lands in its own lazy chunk.)

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/i18n/translations.ts apps/web/src/components/FileConverter.tsx apps/web/src/App.tsx apps/web/src/tests/FileConverter.test.tsx
git commit -m "feat(web): file converter UI (txt/srt/docx), localized, wired into page"
```

---

## Self-Review Notes

- **Spec coverage:** pure `.txt`/`.srt`/docx-xml conversion (Task 1); docx zip round-trip + dispatch + filename + unsupported error (Task 2); UI + i18n + page wiring + download (Task 3). JSZip dynamic-import (Task 2 `docx.ts`), free/unlocked, uz/ru/en all covered. Out-of-scope items (accounts/billing/gating, other formats) correctly excluded.
- **Placeholder scan:** none — all steps carry real code/commands.
- **Type consistency:** `convertPlainText(string)→string`, `transliterateDocxXml(string)→string`, `convertDocx(Uint8Array)→Promise<Uint8Array>`, `convertFile(File)→Promise<{blob,filename}>`, `outputFilename(string)→string`, `UnsupportedFormatError` used identically across tasks.
- **Note:** the `.docx` round-trip is genuinely unit-tested (Task 2 builds a zip with JSZip, converts, re-reads) — not just glue, so no untested seam.
