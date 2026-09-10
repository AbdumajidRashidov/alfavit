import type { Bot } from 'grammy'
import type { Locale } from './i18n'

interface Meta { start: string; help: string; short: string; description: string }

const META: Record<Locale, Meta> = {
  uz: {
    start: 'Botni ishga tushirish',
    help: 'Qanday ishlashini koʻrsatish',
    short: 'Oʻzbek matnini yangi lotin alifbosiga oʻgiradi.',
    description: 'Kirill yoki eski lotindagi oʻzbek matnini 2026-yilgi yangi lotin alifbosiga oʻgiraman. Menga matn yuboring yoki istalgan chatda ichki (inline) rejimda foydalaning. Fayllar, Chrome kengaytmasi va Mac ilovasi: alfavit.uz',
  },
  ru: {
    start: 'Запустить бота',
    help: 'Как пользоваться',
    short: 'Конвертирует узбекский текст в новую латиницу.',
    description: 'Конвертирую узбекский текст с кириллицы или старой латиницы в новую латиницу 2026 года. Отправьте мне текст или используйте инлайн-режим в любом чате. Файлы, расширение Chrome и приложение для Mac: alfavit.uz',
  },
  en: {
    start: 'Start the bot',
    help: 'Show how it works',
    short: 'Converts Uzbek text to the new Latin script.',
    description: 'I convert Uzbek text from Cyrillic or old Latin into the reformed 2026 Latin script. Send me text, or use inline mode in any chat. Files, Chrome extension and Mac app: alfavit.uz',
  },
}

export function commandsFor(locale: Locale) {
  return [
    { command: 'start', description: META[locale].start },
    { command: 'help', description: META[locale].help },
  ]
}

/** Registers the command menu and profile descriptions with Telegram, per locale.
 * English is the default scope; ru/uz are language-scoped overrides. */
export async function applyBotConfig(bot: Bot): Promise<void> {
  await bot.api.setMyCommands(commandsFor('en'))
  await bot.api.setMyShortDescription(META.en.short)
  await bot.api.setMyDescription(META.en.description)
  for (const locale of ['ru', 'uz'] as Locale[]) {
    await bot.api.setMyCommands(commandsFor(locale), { language_code: locale })
    await bot.api.setMyShortDescription(META[locale].short, { language_code: locale })
    await bot.api.setMyDescription(META[locale].description, { language_code: locale })
  }
}
