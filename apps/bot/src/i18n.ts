export type Locale = 'uz' | 'ru' | 'en'

const LOCALES: Locale[] = ['uz', 'ru', 'en']

export function pickLocale(code?: string): Locale {
  const prefix = (code ?? '').slice(0, 2)
  return (LOCALES as string[]).includes(prefix) ? (prefix as Locale) : 'uz'
}

export interface Strings {
  start: string
  help: string
  inlineTitle: string
  inlineEmptyTitle: string
  emptyHint: string
  share: string
  site: string
}

export const strings: Record<Locale, Strings> = {
  uz: {
    start: 'Salom! Menga kirill yoki eski lotinda matn yuboring — yangi lotin yozuviga oʻgirib beraman. Istalgan chatda @alfavit_uz_bot deb yozib, ichki rejimda ham foydalaning. Fayllar (.docx, .txt, .srt): alfavit.uz/files · Mac ilovasi: alfavit.uz/apps',
    help: 'Matn yuboring — men uni 2026-yilgi yangi lotin alifbosiga oʻgiraman. Ichki rejim: istalgan chatda "@alfavit_uz_bot matn". Fayllar: alfavit.uz/files · Mac: alfavit.uz/apps',
    inlineTitle: 'Yangi lotin',
    inlineEmptyTitle: 'Oʻgirish uchun matn yozing',
    emptyHint: 'Oʻzbekcha matn yuboring — yangi lotin yozuviga oʻgiraman.',
    share: 'Ulashish',
    site: 'alfavit.uz',
  },
  ru: {
    start: 'Привет! Отправьте мне текст на кириллице или старой латинице — верну в новой латинице. Также работает в любом чате: наберите @alfavit_uz_bot текст. Файлы (.docx, .txt, .srt): alfavit.uz/files · Приложение для Mac: alfavit.uz/apps',
    help: 'Отправьте текст — я конвертирую его в новую латиницу 2026 года. Инлайн-режим: в любом чате «@alfavit_uz_bot текст». Файлы: alfavit.uz/files · Mac: alfavit.uz/apps',
    inlineTitle: 'Новая латиница',
    inlineEmptyTitle: 'Введите текст для конвертации',
    emptyHint: 'Отправьте узбекский текст — верну его в новой латинице.',
    share: 'Поделиться',
    site: 'alfavit.uz',
  },
  en: {
    start: 'Hi! Send me Uzbek text in Cyrillic or old Latin and I will convert it to the new Latin script. It also works inline — type @alfavit_uz_bot text in any chat. Files (.docx, .txt, .srt): alfavit.uz/files · Mac app: alfavit.uz/apps',
    help: 'Send text and I convert it to the reformed 2026 Latin script. Inline: type "@alfavit_uz_bot text" in any chat. Files: alfavit.uz/files · Mac: alfavit.uz/apps',
    inlineTitle: 'New Latin',
    inlineEmptyTitle: 'Type text to convert',
    emptyHint: 'Send Uzbek text and I will convert it to the new Latin script.',
    share: 'Share',
    site: 'alfavit.uz',
  },
}
