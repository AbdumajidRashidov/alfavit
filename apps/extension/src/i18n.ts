import en from '../public/_locales/en/messages.json'
import ru from '../public/_locales/ru/messages.json'
import uz from '../public/_locales/uz/messages.json'

// chrome.i18n picks strings by the browser's UI language, and desktop Chrome
// has no Uzbek UI. Its "Preferred languages" list can hold Uzbek, so the menu,
// popup and toast follow that list first. esbuild bundles the same _locales
// files, which stay the only copy of the strings.
export type MessageKey = keyof typeof en
export type GetMessage = (key: MessageKey) => string

const LOCALES = new Map<string, Record<MessageKey, { message: string }>>([
  ['uz', uz],
  ['ru', ru],
  ['en', en],
])

// The first preferred language whose base language the extension has wins,
// so Uzbek listed after Russian gives Russian. With no match, chrome.i18n decides.
export async function preferredMessages(): Promise<GetMessage> {
  try {
    for (const tag of await chrome.i18n.getAcceptLanguages()) {
      const messages = LOCALES.get(tag.split('-')[0])
      if (messages) return (key) => messages[key].message
    }
  } catch {
    // A Chrome without the promise form of getAcceptLanguages: chrome.i18n decides.
  }
  return (key) => chrome.i18n.getMessage(key)
}
