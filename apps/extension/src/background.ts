import { toNewLatin } from './convert'
import { preferredMessages, type GetMessage } from './i18n'
import { applyConversion } from './inject'

const MENU_ID = 'alfavit-convert'

// No event reports a change to Chrome's preferred languages, so the title set
// at install is refreshed when Chrome starts and after each use, which makes
// the next right-click current. Reading lastError keeps a missing menu (startup
// racing the install after an update) out of the error log.
function retitleMenu(getMessage: GetMessage): void {
  chrome.contextMenus.update(MENU_ID, { title: getMessage('menuConvert') }, () => void chrome.runtime.lastError)
}

chrome.runtime.onInstalled.addListener(async () => {
  const getMessage = await preferredMessages()
  chrome.contextMenus.create({
    id: MENU_ID,
    title: getMessage('menuConvert'),
    contexts: ['selection'],
  })
})

chrome.runtime.onStartup.addListener(async () => retitleMenu(await preferredMessages()))

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab?.id
  if (info.menuItemId !== MENU_ID || !tabId || !info.selectionText) return
  const converted = toNewLatin(info.selectionText)
  const getMessage = await preferredMessages()
  void chrome.scripting.executeScript({
    target: { tabId },
    func: applyConversion,
    args: [converted, getMessage('toastCopied')],
  })
  retitleMenu(getMessage)
})
