import { beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { getMessage, PREFERRED_LANGUAGES, shown } from './preferredLanguages'

let onInstalled: () => Promise<void>
let onStartup: () => Promise<void>
let onClicked: (info: object, tab: object) => Promise<void>
const getAcceptLanguages = vi.fn<() => Promise<string[]>>()
const create = vi.fn()
const update = vi.fn()
const executeScript = vi.fn().mockResolvedValue([])

beforeAll(async () => {
  vi.stubGlobal('chrome', {
    i18n: { getMessage, getAcceptLanguages },
    runtime: {
      onInstalled: { addListener: (fn: typeof onInstalled) => (onInstalled = fn) },
      onStartup: { addListener: (fn: typeof onStartup) => (onStartup = fn) },
    },
    contextMenus: { create, update, onClicked: { addListener: (fn: typeof onClicked) => (onClicked = fn) } },
    scripting: { executeScript },
  })
  await import('../background')
})

beforeEach(() => vi.clearAllMocks())

const MORE_CASES: typeof PREFERRED_LANGUAGES = [
  { name: 'a script or region subtag still counts', languages: ['uz-Latn-UZ', 'ru'], locale: 'uz' },
  { name: 'languages the extension lacks are skipped', languages: ['de', 'uz', 'en'], locale: 'uz' },
  { name: 'English ahead of Uzbek → English', languages: ['en-GB', 'uz'], locale: 'en' },
  { name: 'an empty list → chrome.i18n', languages: [], locale: 'chrome.i18n' },
]

test.each([...PREFERRED_LANGUAGES, ...MORE_CASES])('menu title at install: $name', async ({ languages, locale }) => {
  getAcceptLanguages.mockResolvedValue(languages)
  await onInstalled()
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'alfavit-convert', title: shown(locale, 'menuConvert'), contexts: ['selection'] }),
  )
})

test('menu title at install: chrome.i18n when the preferred languages cannot be read', async () => {
  getAcceptLanguages.mockRejectedValue(new Error('getAcceptLanguages needs a callback in this Chrome'))
  await onInstalled()
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: '[menuConvert]' }))
})

// Nothing tells the extension that the preferred languages changed, so the
// title created at install would otherwise stay until the next update.
test('each browser start retitles the menu from the preferred languages', async () => {
  getAcceptLanguages.mockResolvedValue(['uz', 'ru'])
  await onStartup()
  expect(update).toHaveBeenCalledWith('alfavit-convert', { title: shown('uz', 'menuConvert') }, expect.any(Function))
  expect(create).not.toHaveBeenCalled()
})

test.each(PREFERRED_LANGUAGES)('page toast: $name', async ({ languages, locale }) => {
  getAcceptLanguages.mockResolvedValue(languages)
  await onClicked({ menuItemId: 'alfavit-convert', selectionText: 'салом' }, { id: 7 })
  expect(executeScript).toHaveBeenCalledWith(
    expect.objectContaining({ target: { tabId: 7 }, args: ['salom', shown(locale, 'toastCopied')] }),
  )
})

test('a click retitles the menu too, so the next right-click follows a changed list', async () => {
  getAcceptLanguages.mockResolvedValue(['uz'])
  await onClicked({ menuItemId: 'alfavit-convert', selectionText: 'салом' }, { id: 7 })
  expect(update).toHaveBeenCalledWith('alfavit-convert', { title: shown('uz', 'menuConvert') }, expect.any(Function))
})
