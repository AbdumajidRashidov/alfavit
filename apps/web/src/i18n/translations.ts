export type Locale = 'uz' | 'ru' | 'en'

export const translations = {
  en: {
    'nav.convert': 'Convert',
    'nav.reform': 'Reform',
    'nav.developers': 'Developers',
    'nav.telegram': 'Telegram',
    'nav.reach': 'Reach us',
    'nav.cta': 'Convert now',
    'hero.headlinePre': "Your words, in Uzbekistan's ",
    'hero.headlineEm': 'new alphabet.',
    'hero.desc': 'Instantly convert Uzbek text from Cyrillic or the old Latin into the reformed 2026 Latin script — free, in your browser, nothing uploaded.',
    'converter.inputLabel': 'Cyrillic or old Latin',
    'converter.outputLabel': 'New Latin',
    'converter.placeholder': 'Matn kiriting…',
    'converter.copy': 'Copy',
    'converter.copied': 'Copied',
    'converter.detected': 'Detected',
    'script.cyrillic': 'Cyrillic',
    'script.old-latin': 'Old Latin',
    'script.foreign': 'Text',
    'morph.title': 'Four letters, reformed.',
    'footer.reform': 'The reform',
    'footer.developers': 'Developers',
    'footer.telegram': 'Telegram',
    'footer.github': 'GitHub',
  },
  uz: {
    'nav.convert': 'Oʻgirish',
    'nav.reform': 'Islohot',
    'nav.developers': 'Dasturchilar',
    'nav.telegram': 'Telegram',
    'nav.reach': 'Aloqa',
    'nav.cta': 'Boshlash',
    'hero.headlinePre': 'Soʻzlaringiz — Oʻzbekistonning ',
    'hero.headlineEm': 'yangi alifbosida.',
    'hero.desc': 'Oʻzbek matnini kirill yoki eski lotindan 2026-yilgi yangilangan lotin yozuviga bir zumda oʻgiring — bepul, brauzeringizda, hech narsa yuklanmaydi.',
    'converter.inputLabel': 'Kirill yoki eski lotin',
    'converter.outputLabel': 'Yangi lotin',
    'converter.placeholder': 'Matn kiriting…',
    'converter.copy': 'Nusxa olish',
    'converter.copied': 'Nusxa olindi',
    'converter.detected': 'Aniqlandi',
    'script.cyrillic': 'Kirill',
    'script.old-latin': 'Eski lotin',
    'script.foreign': 'Matn',
    'morph.title': 'Toʻrt harf, yangilandi.',
    'footer.reform': 'Islohot',
    'footer.developers': 'Dasturchilar',
    'footer.telegram': 'Telegram',
    'footer.github': 'GitHub',
  },
  ru: {
    'nav.convert': 'Конвертер',
    'nav.reform': 'Реформа',
    'nav.developers': 'Разработчикам',
    'nav.telegram': 'Telegram',
    'nav.reach': 'Контакты',
    'nav.cta': 'Начать',
    'hero.headlinePre': 'Ваши слова — в ',
    'hero.headlineEm': 'новом алфавите',
    'hero.desc': 'Мгновенно конвертируйте узбекский текст с кириллицы или старой латиницы в реформированную латиницу 2026 года — бесплатно, в браузере, ничего не загружается.',
    'converter.inputLabel': 'Кириллица или старая латиница',
    'converter.outputLabel': 'Новая латиница',
    'converter.placeholder': 'Введите текст…',
    'converter.copy': 'Копировать',
    'converter.copied': 'Скопировано',
    'converter.detected': 'Определено',
    'script.cyrillic': 'Кириллица',
    'script.old-latin': 'Старая латиница',
    'script.foreign': 'Текст',
    'morph.title': 'Четыре буквы, реформированы.',
    'footer.reform': 'Реформа',
    'footer.developers': 'Разработчикам',
    'footer.telegram': 'Telegram',
    'footer.github': 'GitHub',
  },
} as const

export type TranslationKey = keyof typeof translations.en

const LOCALES: Locale[] = ['uz', 'ru', 'en']

export function detectInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem('alfavit.locale')
    if (saved && LOCALES.includes(saved as Locale)) return saved as Locale
  } catch { /* ignore */ }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'uz').slice(0, 2)
  return (LOCALES as string[]).includes(nav) ? (nav as Locale) : 'uz'
}
