import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

// The manifest reads these files through chrome.i18n, and src/i18n.ts bundles
// them for the menu, popup and toast. Chrome refuses to load an extension whose
// manifest names a missing message, and a key missing from one locale silently
// falls back to English for those users.
const ROOT = resolve(__dirname, '../..')
const LOCALES = ['en', 'uz', 'ru']

type Messages = Record<string, { message: string; description?: string }>
const read = (locale: string): Messages =>
  JSON.parse(readFileSync(resolve(ROOT, 'public/_locales', locale, 'messages.json'), 'utf8'))

const manifest = JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf8'))

const usedKeys = (): string[] => {
  const keys = new Set<string>()
  for (const m of JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)) keys.add(m[1])
  for (const file of readdirSync(resolve(ROOT, 'src')).filter((f) => f.endsWith('.ts'))) {
    const src = readFileSync(resolve(ROOT, 'src', file), 'utf8')
    for (const m of src.matchAll(/getMessage\(\s*'(\w+)'/g)) keys.add(m[1])
  }
  return [...keys].sort()
}

test('the manifest is localized, with English as the fallback', () => {
  expect(manifest.default_locale).toBe('en')
  expect(manifest.name).toBe('__MSG_extName__')
  expect(manifest.description).toBe('__MSG_extDescription__')
})

test('ships exactly the en, uz and ru locales', () => {
  expect(readdirSync(resolve(ROOT, 'public/_locales')).sort()).toEqual([...LOCALES].sort())
})

test('every key the code and manifest use exists in every locale', () => {
  const used = usedKeys()
  expect(used.length).toBeGreaterThan(0)
  for (const locale of LOCALES) expect(Object.keys(read(locale)).sort(), locale).toEqual(used)
})

test('every message is non-empty', () => {
  for (const locale of LOCALES)
    for (const [key, { message }] of Object.entries(read(locale))) expect(message.trim(), `${locale}.${key}`).not.toBe('')
})

test('English keeps the wording the extension shipped with', () => {
  const en = read('en')
  expect(en.extName.message).toBe('Alfavit — new Uzbek Latin')
  expect(en.extDescription.message).toBe(
    'Convert Uzbek text from Cyrillic or old Latin to the reformed new Latin, right in your browser.',
  )
  expect(en.menuConvert.message).toBe('Convert to new Latin')
  expect(en.popupInputPlaceholder.message).toBe('Matn kiriting…')
  expect(en.popupOutputPlaceholder.message).toBe('new Latin')
  expect(en.popupCopy.message).toBe('Copy')
  expect(en.popupCopied.message).toBe('Copied')
  expect(en.toastCopied.message).toBe('Copied — new Latin')
})

test('name and description fit the Chrome Web Store limits in every locale', () => {
  for (const locale of LOCALES) {
    const m = read(locale)
    expect([...m.extName.message].length, `${locale}.extName`).toBeLessThanOrEqual(75)
    expect([...m.extDescription.message].length, `${locale}.extDescription`).toBeLessThanOrEqual(132)
  }
})
