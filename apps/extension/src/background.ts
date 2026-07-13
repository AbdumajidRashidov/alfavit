import { toNewLatin } from './convert'
import { applyConversion } from './inject'

const MENU_ID = 'alfavit-convert'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Convert to new Latin',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id || !info.selectionText) return
  const converted = toNewLatin(info.selectionText)
  void chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: applyConversion,
    args: [converted],
  })
})
