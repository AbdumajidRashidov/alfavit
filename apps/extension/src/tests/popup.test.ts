// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'

// The fake getMessage returns the key in brackets, so a label left hard-coded
// in popup.html or popup.ts shows up as a mismatch.
const getMessage = (key: string) => `[${key}]`
const writeText = vi.fn().mockResolvedValue(undefined)

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

beforeAll(async () => {
  const html = readFileSync(resolve(__dirname, '../../public/popup.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  vi.stubGlobal('chrome', { i18n: { getMessage } })
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  vi.useFakeTimers()
  await import('../popup')
})

afterAll(() => vi.useRealTimers())

test('the placeholders and the copy button come from chrome.i18n', () => {
  expect($<HTMLTextAreaElement>('in').placeholder).toBe('[popupInputPlaceholder]')
  expect($<HTMLTextAreaElement>('out').placeholder).toBe('[popupOutputPlaceholder]')
  expect($('copy').textContent).toBe('[popupCopy]')
})

test('copying shows the localized "copied" label, then reverts', async () => {
  const input = $<HTMLTextAreaElement>('in')
  input.value = 'салом'
  input.dispatchEvent(new Event('input'))
  $('copy').click()
  await writeText.mock.results[0].value
  expect(writeText).toHaveBeenCalledWith('salom')
  expect($('copy').textContent).toBe('[popupCopied]')
  vi.advanceTimersByTime(1200)
  expect($('copy').textContent).toBe('[popupCopy]')
})
