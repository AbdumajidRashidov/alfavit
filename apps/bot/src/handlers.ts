import { InlineQueryResultBuilder } from 'grammy'
import type { InlineQueryResult, InlineKeyboardMarkup } from 'grammy/types'
import { transliterate } from '@alfavit/engine'
import { strings, type Locale } from './i18n'

export const MAX_INPUT = 4000

/** Telegram caps inline queries at 256 characters; longer results get only the site button. */
export const INLINE_QUERY_MAX = 256
export const SITE_URL = 'https://alfavit.uz/?utm_source=bot&utm_medium=button&utm_campaign=senate-2026-09'

/** Inline keyboard under every conversion reply: one-tap Share (opens inline mode
 * pre-filled with the result, so the sent message is stamped "via @alfavit_uz_bot")
 * and a link to the site. Pure function so it is testable without Telegram. */
export function buildReplyKeyboard(converted: string, locale: Locale): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup['inline_keyboard'] = []
  if (converted.length <= INLINE_QUERY_MAX) {
    rows.push([
      {
        text: strings[locale].share,
        switch_inline_query_chosen_chat: {
          query: converted,
          allow_user_chats: true,
          allow_bot_chats: false,
          allow_group_chats: true,
          allow_channel_chats: true,
        },
      },
    ])
  }
  rows.push([{ text: strings[locale].site, url: SITE_URL }])
  return { inline_keyboard: rows }
}

export function handleMessage(text: string, locale: Locale): string {
  const capped = text.slice(0, MAX_INPUT)
  if (!capped.trim()) return strings[locale].emptyHint
  return transliterate(capped).text
}

export function buildInlineResults(query: string, locale: Locale, logoUrl?: string): InlineQueryResult[] {
  const withThumb = (description: string) =>
    logoUrl ? { description, thumbnail_url: logoUrl } : { description }
  const capped = query.slice(0, MAX_INPUT)
  if (!capped.trim()) {
    const hint = strings[locale].emptyHint
    return [InlineQueryResultBuilder.article('empty', strings[locale].inlineEmptyTitle, withThumb(hint)).text(hint)]
  }
  const converted = transliterate(capped).text
  const preview = converted.slice(0, 100)
  return [InlineQueryResultBuilder.article('convert', strings[locale].inlineTitle, withThumb(preview)).text(converted)]
}
