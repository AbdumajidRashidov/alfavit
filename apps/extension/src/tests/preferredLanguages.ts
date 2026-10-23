import en from '../../public/_locales/en/messages.json'
import ru from '../../public/_locales/ru/messages.json'
import uz from '../../public/_locales/uz/messages.json'

// The tests stub chrome.i18n.getMessage to return the key in brackets, so a
// string chrome.i18n picked is told apart from one read from messages.json.
export const getMessage = (key: string) => `[${key}]`

type Shown = 'uz' | 'ru' | 'en' | 'chrome.i18n'
const LOCALES = { uz, ru, en }

// What the user should see for a key: that locale's string, or chrome.i18n's
// pick when none of Chrome's preferred languages is one the extension has.
export const shown = (locale: Shown, key: keyof typeof en): string =>
  locale === 'chrome.i18n' ? getMessage(key) : LOCALES[locale][key].message

// Chrome's "Preferred languages" (chrome.i18n.getAcceptLanguages) → the locale
// of the menu, popup and toast: the first entry whose base language is uz, ru
// or en wins. Desktop Chrome has no Uzbek UI, so chrome.i18n alone never
// shows Uzbek there.
export const PREFERRED_LANGUAGES: { name: string; languages: string[]; locale: Shown }[] = [
  { name: 'Uzbek first → Uzbek', languages: ['uz', 'ru', 'en-US', 'en'], locale: 'uz' },
  { name: 'Russian first → Russian', languages: ['ru-RU', 'ru', 'en-US', 'en'], locale: 'ru' },
  { name: 'Uzbek after Russian → Russian', languages: ['ru', 'uz', 'en'], locale: 'ru' },
  { name: 'none of uz, ru, en → chrome.i18n', languages: ['de-DE', 'de', 'fr'], locale: 'chrome.i18n' },
]
