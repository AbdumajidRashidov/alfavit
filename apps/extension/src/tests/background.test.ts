import { beforeAll, expect, test, vi } from 'vitest'

// The fake getMessage returns the key in brackets, so a hard-coded string in
// place of a chrome.i18n lookup shows up as a mismatch.
const getMessage = (key: string) => `[${key}]`

let onInstalled: () => void
let onClicked: (info: object, tab: object) => void
const create = vi.fn()
const executeScript = vi.fn().mockResolvedValue([])

beforeAll(async () => {
  vi.stubGlobal('chrome', {
    i18n: { getMessage },
    runtime: { onInstalled: { addListener: (fn: () => void) => (onInstalled = fn) } },
    contextMenus: { create, onClicked: { addListener: (fn: typeof onClicked) => (onClicked = fn) } },
    scripting: { executeScript },
  })
  await import('../background')
})

test('the right-click menu title comes from chrome.i18n', () => {
  onInstalled()
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: '[menuConvert]', contexts: ['selection'] }))
})

test('the page gets the converted text and a localized "copied" toast', () => {
  onClicked({ menuItemId: 'alfavit-convert', selectionText: 'салом' }, { id: 7 })
  expect(executeScript).toHaveBeenCalledWith(
    expect.objectContaining({ target: { tabId: 7 }, args: ['salom', '[toastCopied]'] }),
  )
})
