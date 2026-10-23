// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'
import { getMessage, PREFERRED_LANGUAGES, shown } from './preferredLanguages'

const getAcceptLanguages = vi.fn<() => Promise<string[]>>()
const writeText = vi.fn().mockResolvedValue(undefined)
const html = readFileSync(resolve(__dirname, '../../public/popup.html'), 'utf8')

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

// popup.ts labels the page once, as it loads, so each test opens a fresh popup.
async function openPopup(languages: string[]): Promise<void> {
  getAcceptLanguages.mockResolvedValue(languages)
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  vi.resetModules()
  await import('../popup')
}

beforeAll(() => {
  vi.stubGlobal('chrome', { i18n: { getMessage, getAcceptLanguages } })
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  vi.useFakeTimers()
})

afterAll(() => vi.useRealTimers())

// popupInputPlaceholder reads the same in uz and en, so the other two labels
// are the ones that tell the locales apart.
test.each(PREFERRED_LANGUAGES)('labels: $name', async ({ languages, locale }) => {
  await openPopup(languages)
  expect($<HTMLTextAreaElement>('in').placeholder).toBe(shown(locale, 'popupInputPlaceholder'))
  expect($<HTMLTextAreaElement>('out').placeholder).toBe(shown(locale, 'popupOutputPlaceholder'))
  expect($('copy').textContent).toBe(shown(locale, 'popupCopy'))
})

test('copying shows "copied" in the same language, then reverts', async () => {
  await openPopup(['uz', 'ru', 'en'])
  const input = $<HTMLTextAreaElement>('in')
  input.value = 'салом'
  input.dispatchEvent(new Event('input'))
  $('copy').click()
  await writeText.mock.results.at(-1)?.value
  expect(writeText).toHaveBeenCalledWith('salom')
  expect($('copy').textContent).toBe(shown('uz', 'popupCopied'))
  vi.advanceTimersByTime(1200)
  expect($('copy').textContent).toBe(shown('uz', 'popupCopy'))
})
